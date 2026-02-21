#!/usr/bin/env node
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  appendGitHubOutput,
  createEndpoint,
  getApiKey,
  getBranchByName,
  getProjectId,
  listEndpoints,
  maskForGitHubActions,
  neonRequest,
  parseArgs,
} from "./_neon-api.mjs";

const RETRYABLE_EXIT_CODE = 1;
const NON_RETRYABLE_EXIT_CODE = 2;

class TaggedFailure extends Error {
  constructor(reasonTag, message, { retryable }) {
    super(message);
    this.name = "TaggedFailure";
    this.reasonTag = reasonTag;
    this.retryable = retryable;
  }
}

function toBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  const v = String(value ?? "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function isPoolerHost(host) {
  return String(host || "").toLowerCase().includes("-pooler");
}

function toNonPoolerHost(host) {
  if (!host) return "";
  return String(host).replace("-pooler", "");
}

function toPoolerHost(host) {
  if (!host) return "";
  const normalized = toNonPoolerHost(host);
  if (isPoolerHost(normalized)) return normalized;
  return normalized.replace(/^ep-/, "ep-") === normalized
    ? normalized.replace(/^ep-([^.]*)\./, "ep-$1-pooler.")
    : normalized;
}

function endpointHost(endpoint) {
  return String(endpoint?.host || endpoint?.proxy_host || "").trim();
}

function endpointMatchesPooler(endpoint) {
  if (typeof endpoint?.pooler_enabled === "boolean") {
    return endpoint.pooler_enabled;
  }
  return isPoolerHost(endpointHost(endpoint));
}

function pickEndpointForBranch(endpoints, { branchId, pooled }) {
  const inBranch = (endpoints || []).filter((e) => e.branch_id === branchId);
  const filtered = inBranch.filter((e) => endpointMatchesPooler(e) === pooled);

  if (filtered.length === 0) return null;
  return filtered.find((e) => e.type === "read_write") || filtered[0];
}

function pickReadWriteEndpoint(endpoints, branchId) {
  const inBranch = (endpoints || []).filter((e) => e.branch_id === branchId);
  return inBranch.find((e) => e.type === "read_write") || inBranch[0] || null;
}

function replaceConnectionHost(uri, host) {
  if (!uri || !host) return uri;
  const parsed = new URL(uri);
  parsed.hostname = host;
  return parsed.toString();
}

export function selectConnectionHosts(endpoints, branchId) {
  const directEndpoint = pickEndpointForBranch(endpoints, { branchId, pooled: false });
  const pooledEndpoint = pickEndpointForBranch(endpoints, { branchId, pooled: true });
  const primaryEndpoint = pickReadWriteEndpoint(endpoints, branchId);

  const primaryHost = endpointHost(primaryEndpoint);
  const directHost = endpointHost(directEndpoint) || (isPoolerHost(primaryHost) ? "" : primaryHost);
  const pooledHost = endpointHost(pooledEndpoint) || (directHost ? toPoolerHost(directHost) : "");

  return {
    directEndpoint,
    pooledEndpoint,
    primaryEndpoint,
    directHost,
    pooledHost,
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function buildConnectionUri({ projectId, apiKey, branchId, endpointId, databaseName, roleName }) {
  const result = await neonRequest({
    path:
      `/projects/${projectId}/connection_uri` +
      `?branch_id=${encodeURIComponent(branchId)}` +
      `&endpoint_id=${encodeURIComponent(endpointId)}` +
      `&database_name=${encodeURIComponent(databaseName)}` +
      `&role_name=${encodeURIComponent(roleName)}`,
    apiKey,
  });

  if (!result?.uri) {
    throw new Error("Neon API did not return a connection uri (missing result.uri).");
  }
  return result.uri;
}

const parsedArgs = parseArgs(process.argv.slice(2));
const requestedBranchName = parsedArgs["branch-name"] || process.env.PR_BRANCH_NAME || "";
let resolvedProjectId = parsedArgs["project-id"] || process.env.NEON_PROJECT_ID || "";

async function main() {
  const args = parsedArgs;
  const projectId = getProjectId(args);
  resolvedProjectId = projectId;
  const apiKey = getApiKey(args);

  const branchName = args["branch-name"];
  if (!branchName) throw new Error("Missing required --branch-name");

  const databaseName = args["database-name"] || process.env.NEON_DATABASE_NAME || "neondb";
  const roleName = args["role-name"] || process.env.NEON_ROLE_NAME || "neondb_owner";

  const requirePooled = toBool(args["require-pooled"] ?? process.env.NEON_REQUIRE_POOLED ?? "false");

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) {
    throw new TaggedFailure("BRANCH_NOT_FOUND", `Branch "${branchName}" not found.`, {
      retryable: true,
    });
  }

  const branchEndpoints = await listEndpoints({
    projectId,
    apiKey,
    branchId: branch.id,
  });
  const selected = selectConnectionHosts(branchEndpoints, branch.id);

  if (branchEndpoints.length === 0) {
    let lastCreateFailure = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await createEndpoint({ projectId, apiKey, branchId: branch.id });
        lastCreateFailure = null;
        break;
      } catch (error) {
        lastCreateFailure = error;
      }

      if (attempt < 3) {
        await sleep(2000);
      }
    }

    const refreshedEndpoints = await listEndpoints({
      projectId,
      apiKey,
      branchId: branch.id,
    });

    if (refreshedEndpoints.length > 0) {
      throw new TaggedFailure(
        "ENDPOINTS_NOT_READY",
        `Branch "${branchName}" endpoints appeared after create attempts; retry to continue URL generation.`,
        { retryable: true }
      );
    }

    const failureBits = [];
    if (lastCreateFailure?.failReason) failureBits.push(`CREATE_FAIL_REASON=${lastCreateFailure.failReason}`);
    if (lastCreateFailure?.createEndpointStatus) {
      failureBits.push(`CREATE_STATUS=${lastCreateFailure.createEndpointStatus}`);
    }
    if (lastCreateFailure?.createEndpointBody) {
      failureBits.push(`CREATE_BODY=${lastCreateFailure.createEndpointBody}`);
    }

    const failureSuffix = failureBits.length > 0 ? ` Last create failure: ${failureBits.join(" ")}` : "";

    throw new TaggedFailure(
      "ENDPOINTS_NOT_READY",
      `Branch "${branchName}" exists but endpoints not ready yet after 3 create attempts. Found 0 endpoint(s) for this branch.${failureSuffix}`,
      { retryable: true }
    );
  }

  if (!selected.primaryEndpoint) {
    throw new TaggedFailure(
      "ENDPOINTS_NOT_READY",
      `Branch "${branchName}" has endpoints but no usable read/write endpoint yet.`,
      { retryable: true }
    );
  }

  if (!selected.directHost) {
    throw new TaggedFailure(
      "DIRECT_ENDPOINT_NOT_AVAILABLE",
      `Branch "${branchName}" has endpoint(s) but no direct (non-pooler) host is available yet.`,
      { retryable: true }
    );
  }

  if (requirePooled && !selected.pooledHost) {
    throw new TaggedFailure(
      "ENDPOINTS_NOT_READY",
      `Branch "${branchName}" exists but pooled endpoint is not ready yet (NEON_REQUIRE_POOLED=true).`,
      { retryable: true }
    );
  }

  const baseUri = await buildConnectionUri({
    projectId,
    apiKey,
    branchId: branch.id,
    endpointId: selected.primaryEndpoint.id,
    databaseName,
    roleName,
  });

  const directUrl = replaceConnectionHost(baseUri, selected.directHost);
  if (isPoolerHost(new URL(directUrl).hostname)) {
    throw new TaggedFailure(
      "DIRECT_ENDPOINT_NOT_AVAILABLE",
      `Computed DIRECT_URL host "${new URL(directUrl).hostname}" is a pooler host, refusing to continue.`,
      { retryable: true }
    );
  }

  let databaseUrl = directUrl;
  if (selected.pooledHost) {
    databaseUrl = replaceConnectionHost(baseUri, selected.pooledHost);
  } else {
    console.warn(
      `WARN: No pooled endpoint found for branch "${branchName}". Falling back DATABASE_URL to DIRECT_URL. ` +
        `Set NEON_REQUIRE_POOLED=true to enforce pooled endpoints.`
    );
  }

  maskForGitHubActions(databaseUrl);
  maskForGitHubActions(directUrl);

  appendGitHubOutput("database_url", databaseUrl);
  appendGitHubOutput("direct_url", directUrl);

  console.log(`set-env OK: connection URLs ready for Neon branch "${branchName}".`);
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((err) => {
    const projectId = resolvedProjectId || "";
    const branchName = requestedBranchName || "";
    const reasonTag = err instanceof TaggedFailure ? err.reasonTag : "OTHER";
    const retryable = err instanceof TaggedFailure ? err.retryable : false;
    const message = err?.message || String(err);

    console.error(
      `FAIL_REASON=${reasonTag} NEON_PROJECT_ID=${projectId || "<unset>"} PR_BRANCH_NAME=${branchName || "<unset>"} MESSAGE=${message}`
    );

    process.exit(retryable ? RETRYABLE_EXIT_CODE : NON_RETRYABLE_EXIT_CODE);
  });
}
