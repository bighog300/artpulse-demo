#!/usr/bin/env node
import process from "node:process";
import {
  appendGitHubOutput,
  getApiKey,
  getBranchByName,
  getProjectId,
  maskForGitHubActions,
  neonRequest,
  parseArgs,
} from "./_neon-api.mjs";

function toBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  const v = String(value ?? "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function summarizeEndpoints(endpoints) {
  const rows = (endpoints || []).map((e) => ({
    id: e.id,
    branch_id: e.branch_id,
    type: e.type,
    pooler_enabled: Boolean(e.pooler_enabled),
    host: e.host,
  }));
  return JSON.stringify(rows);
}

function pickEndpointForBranch(endpoints, { branchId, pooled }) {
  const inBranch = (endpoints || []).filter((e) => e.branch_id === branchId);
  const filtered = inBranch.filter((e) => Boolean(e.pooler_enabled) === pooled);

  if (filtered.length === 0) return null;
  return filtered.find((e) => e.type === "read_write") || filtered[0];
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = getProjectId(args);
  const apiKey = getApiKey(args);

  const branchName = args["branch-name"];
  if (!branchName) throw new Error("Missing required --branch-name");

  const databaseName = args["database-name"] || process.env.NEON_DATABASE_NAME || "neondb";
  const roleName = args["role-name"] || process.env.NEON_ROLE_NAME || "neondb_owner";

  const requirePooled = toBool(args["require-pooled"] ?? process.env.NEON_REQUIRE_POOLED ?? "false");

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) throw new Error(`Branch "${branchName}" not found.`);

  // Fetch endpoints. Neon may return multiple endpoints; we must filter by branch_id.
  const endpointResp = await neonRequest({
    path: `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(branch.id)}`,
    apiKey,
  });

  const endpoints = endpointResp?.endpoints || [];

  const directEndpoint = pickEndpointForBranch(endpoints, { branchId: branch.id, pooled: false });
  const pooledEndpoint = pickEndpointForBranch(endpoints, { branchId: branch.id, pooled: true });

  if (!directEndpoint) {
    throw new Error(
      `No direct endpoint (pooler_enabled=false) found for branch "${branchName}". ` +
        `All endpoints: ${summarizeEndpoints(endpoints)}`
    );
  }

  if (requirePooled && !pooledEndpoint) {
    throw new Error(
      `No pooled endpoint (pooler_enabled=true) found for branch "${branchName}" and NEON_REQUIRE_POOLED=true. ` +
        `All endpoints: ${summarizeEndpoints(endpoints)}`
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
  // eslint-disable-next-line no-console
  console.error(err?.message || err);
  process.exit(1);
});
