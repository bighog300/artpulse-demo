#!/usr/bin/env node
import {
  getApiKey,
  getBranchByName,
  getProjectId,
  neonRequest,
  parseArgs,
} from "./_neon-api.mjs";

const HARD_PROTECTED_BRANCHES = new Set(["main", "staging", "production"]);

function getProtectedBranchNames(args) {
  const protectedBranches = new Set(HARD_PROTECTED_BRANCHES);
  const parentBranchName =
    args["parent-branch"] ||
    process.env.PARENT_NEON_BRANCH ||
    process.env.STAGING_PARENT_BRANCH ||
    process.env.NEON_PARENT_BRANCH;

  if (parentBranchName) {
    protectedBranches.add(parentBranchName);
  }

  return protectedBranches;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = getProjectId(args);
  const apiKey = getApiKey(args);
  const branchName = args["branch-name"];

  if (!branchName) {
    throw new Error("Missing required --branch-name");
  }

  const protectedBranchNames = getProtectedBranchNames(args);
  if (protectedBranchNames.has(branchName)) {
    throw new Error(`Refusing to delete protected branch \"${branchName}\".`);
  }

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) {
    console.log(`Neon branch "${branchName}" not found, nothing to delete.`);
    return;
  }

  try {
    await neonRequest({
      method: "DELETE",
      path: `/projects/${projectId}/branches/${branch.id}`,
      apiKey,
    });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const isNotFound = message.includes("(404)") || message.includes("not found");

    if (!isNotFound) {
      throw error;
    }

    console.log(`Neon branch "${branchName}" not found, nothing to delete.`);
    return;
  }

  console.log(`Deleted preview branch ${branch.name} (${branch.id})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
