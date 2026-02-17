#!/usr/bin/env node
// scripts/neon/get-connection-urls.mjs

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

function pickEndpoint(endpoints, pooled) {
  const filtered = (endpoints || []).filter((e) => Boolean(e.pooler_enabled) === pooled);
  if (filtered.length === 0) return null;
  // Prefer read_write if present.
  return filtered.find((e) => e.type === "read_write") || filtered[0];
}

function summarizeEndpoints(endpoints) {
  const list = (endpoints || []).map((e) => ({
    id: e.id,
    type: e.type,
    pooler_enabled: Boolean(e.pooler_enabled),
    branch_id: e.branch_id,
    host: e.host,
  }));
  return JSON.stringify(list);
}

async function buildConnectionUri({ projectId, apiKey, branchId, endpointId, databaseName, roleName }) {
  const result = await neonRequest({
    path:
      `/projects/${encodeURIComponent(projectId)}/connection_uri` +
      `?branch_id=${encodeURIComponent(branchId)}` +
      `&endpoint_id=${encodeURIComponent(endpointId)}` +
      `&database_name=${encodeURIComponent(databaseName)}` +
      `&role_name=${encodeURIComponent(roleName)}`,
    apiKey,
  });
  if (!result?.uri) throw new Error("Neon API did not return connection uri.");
  return result.uri;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = getApiKey(args);
  const projectId = getProjectId(args);

  const branchName = args["branch-name"];
  if (!branchName) throw new Error("Missing required --branch-name");

  const databaseName = args["database-name"] || process.env.NEON_DATABASE_NAME || "neondb";
  const roleName = args["role-name"] || process.env.NEON_ROLE_NAME || "neondb_owner";

  const requirePooled =
    String(args["require-pooled"] ?? process.env.NEON_REQUIRE_POOLED ?? "false") === "true";

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) throw new Error(`Branch "${branchName}" not found.`);

  const endpointResp = await neonRequest({
    path: `/projects/${encodeURIComponent(projectId)}/endpoints?branch_id=${encodeURIComponent(branch.id)}`,
    apiKey,
  });

  const endpoints = endpointResp?.endpoints || [];

  const pooledEndpoint = pickEndpoint(endpoints, true);
  const directEndpoint = pickEndpoint(endpoints, false);

  // Direct is required because Prisma migrations must use direct.
  if (!directEndpoint) {
    throw new Error(
      `Expected a direct endpoint (pooler_enabled=false) for branch "${branchName}". ` +
        `Endpoints: ${summarizeEndpoints(endpoints)}`
    );
  }

  // Pooled is preferred but optional unless explicitly required.
  if (requirePooled && !pooledEndpoint) {
    throw new Error(
      `Expected a pooled endpoint (pooler_enabled=true) for branch "${branchName}" but none found. ` +
        `Endpoints: ${summarizeEndpoints(endpoints)}`
    );
  }

  const directUrl = await buildConnectionUri({
    projectId,
    apiKey,
    branchId: branch.id,
    endpointId: directEndpoint.id,
    databaseName,
    roleName,
  });

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
      `WARN: No pooled endpoint found for branch "${branchName}". ` +
        `Falling back DATABASE_URL to DIRECT_URL. ` +
        `Set NEON_REQUIRE_POOLED=true to enforce pooled endpoints.`
    );
  }

  // Mask values in GitHub logs
  maskForGitHubActions(databaseUrl);
  maskForGitHubActions(directUrl);

  // Output keys must match workflow usage:
  // steps.neon-urls.outputs.database_url and .direct_url
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
