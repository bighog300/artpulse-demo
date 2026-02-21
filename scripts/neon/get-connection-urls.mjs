#!/usr/bin/env node
import process from "node:process";
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

function pickEndpointForBranch(endpoints, { branchId, pooled }) {
  const inBranch = (endpoints || []).filter((e) => e.branch_id === branchId);
  const filtered = inBranch.filter((e) => Boolean(e.pooler_enabled) === pooled);

  if (filtered.length === 0) return null;
  return filtered.find((e) => e.type === "read_write") || filtered[0];
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function buildConnectionUri({ projectId, apiKey, branchId, endpointId, databaseName, roleName }) {
  // Neon API: GET /projects/:id/connection_uri?branch_id=...&endpoint_id=...&database_name=...&role_name=...
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
  const directEndpoint = pickEndpointForBranch(branchEndpoints, { branchId: branch.id, pooled: false });
  const pooledEndpoint = pickEndpointForBranch(branchEndpoints, { branchId: branch.id, pooled: true });

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

  if (!directEndpoint) {
    throw new TaggedFailure(
      "DIRECT_ENDPOINT_MISSING",
      `Branch "${branchName}" has ${branchEndpoints.length} endpoint(s) but no direct/non-pooler endpoint.`,
      { retryable: false }
    );
  }

  if (requirePooled && !pooledEndpoint) {
    throw new TaggedFailure(
      "ENDPOINTS_NOT_READY",
      `Branch "${branchName}" exists but pooled endpoint is not ready yet (NEON_REQUIRE_POOLED=true).`,
      { retryable: true }
    );
  }

  // DIRECT_URL (required for prisma migrate deploy)
  const directUrl = await buildConnectionUri({
    projectId,
    apiKey,
    branchId: branch.id,
    endpointId: directEndpoint.id,
    databaseName,
    roleName,
  });

  // DATABASE_URL (prefer pooled; fallback to direct)
  let databaseUrl = directUrl;
  if (pooledEndpoint) {
    databaseUrl = await buildConnectionUri({
      projectId,
      apiKey,
      branchId: branch.id,
      endpointId: pooledEndpoint.id,
      databaseName,
      roleName,
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `WARN: No pooled endpoint found for branch "${branchName}". Falling back DATABASE_URL to DIRECT_URL. ` +
        `Set NEON_REQUIRE_POOLED=true to enforce pooled endpoints.`
    );
  }

  // Mask in GitHub logs
  maskForGitHubActions(databaseUrl);
  maskForGitHubActions(directUrl);

  // Output keys must match workflow:
  // steps.neon-urls.outputs.database_url and steps.neon-urls.outputs.direct_url
  appendGitHubOutput("database_url", databaseUrl);
  appendGitHubOutput("direct_url", directUrl);

  // eslint-disable-next-line no-console
  console.log(`set-env OK: connection URLs ready for Neon branch "${branchName}".`);
}

main().catch((err) => {
  const projectId = resolvedProjectId || "";
  const branchName = requestedBranchName || "";
  const reasonTag = err instanceof TaggedFailure ? err.reasonTag : "OTHER";
  const retryable = err instanceof TaggedFailure ? err.retryable : false;
  const message = err?.message || String(err);

  // eslint-disable-next-line no-console
  console.error(
    `FAIL_REASON=${reasonTag} NEON_PROJECT_ID=${projectId || "<unset>"} PR_BRANCH_NAME=${branchName || "<unset>"} MESSAGE=${message}`
  );

  process.exit(retryable ? RETRYABLE_EXIT_CODE : NON_RETRYABLE_EXIT_CODE);
});
