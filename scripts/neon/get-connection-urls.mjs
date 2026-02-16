#!/usr/bin/env node
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
  const filtered = (endpoints || []).filter((endpoint) => Boolean(endpoint.pooler_enabled) === pooled);
  if (filtered.length === 0) return null;
  return filtered.find((endpoint) => endpoint.type === "read_write") || filtered[0];
}

async function buildConnectionUri({ projectId, apiKey, branchId, endpointId, databaseName, roleName }) {
  const result = await neonRequest({
    path: `/projects/${projectId}/connection_uri?branch_id=${encodeURIComponent(branchId)}&endpoint_id=${encodeURIComponent(endpointId)}&database_name=${encodeURIComponent(databaseName)}&role_name=${encodeURIComponent(roleName)}`,
    apiKey,
  });
  return result.uri;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = getProjectId(args);
  const apiKey = getApiKey(args);
  const branchName = args["branch-name"];
  const databaseName = args["database-name"] || process.env.NEON_DATABASE_NAME || "neondb";
  const roleName = args["role-name"] || process.env.NEON_ROLE_NAME || "neondb_owner";

  if (!branchName) {
    throw new Error("Missing required --branch-name");
  }

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) {
    throw new Error(`Branch \"${branchName}\" not found.`);
  }

  const endpointResp = await neonRequest({
    path: `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(branch.id)}`,
    apiKey,
  });

  const pooledEndpoint = pickEndpoint(endpointResp.endpoints, true);
  const directEndpoint = pickEndpoint(endpointResp.endpoints, false);

  if (!pooledEndpoint || !directEndpoint) {
    throw new Error(`Expected both pooled and direct endpoints for branch \"${branchName}\".`);
  }

  const databaseUrl = await buildConnectionUri({
    projectId,
    apiKey,
    branchId: branch.id,
    endpointId: pooledEndpoint.id,
    databaseName,
    roleName,
  });

  const directUrl = await buildConnectionUri({
    projectId,
    apiKey,
    branchId: branch.id,
    endpointId: directEndpoint.id,
    databaseName,
    roleName,
  });

  maskForGitHubActions(databaseUrl);
  maskForGitHubActions(directUrl);

  appendGitHubOutput("database_url", databaseUrl);
  appendGitHubOutput("direct_url", directUrl);

  console.log(`set-env OK: connection URLs ready for Neon branch \"${branchName}\".`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
