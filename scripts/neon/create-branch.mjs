#!/usr/bin/env node
import {
  appendGitHubOutput,
  getApiKey,
  getBranchByName,
  getProjectId,
  neonRequest,
  parseArgs,
} from "./_neon-api.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = getProjectId(args);
  const apiKey = getApiKey(args);
  const branchName = args["branch-name"];
  const parentBranchName = args["parent-branch"] || "main";

  if (!branchName) {
    throw new Error("Missing required --branch-name");
  }

  let branch = await getBranchByName({ projectId, apiKey, branchName });
  let created = false;

  if (!branch) {
    const parentBranch = await getBranchByName({
      projectId,
      apiKey,
      branchName: parentBranchName,
    });

    if (!parentBranch) {
      throw new Error(`Parent branch \"${parentBranchName}\" not found in Neon project.`);
    }

    try {
      const response = await neonRequest({
        method: "POST",
        path: `/projects/${projectId}/branches`,
        apiKey,
        body: {
          branch: {
            name: branchName,
            parent_id: parentBranch.id,
          },
        },
      });

      branch = response.branch;
      created = true;
    } catch (error) {
      const message = String(error?.message || "");
      const isAlreadyExistsError =
        message.includes("(409)") ||
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("branch already exists");

      if (!isAlreadyExistsError) {
        throw error;
      }

      branch = await getBranchByName({ projectId, apiKey, branchName });
      if (!branch) {
        throw new Error(
          `Neon branch "${branchName}" already exists but could not be fetched afterwards.`
        );
      }
    }
  }

  appendGitHubOutput("branch_id", branch.id);
  appendGitHubOutput("branch_name", branch.name);
  appendGitHubOutput("branch_created", String(created));

  console.log(`set-env OK: Neon branch \"${branch.name}\" ready (${created ? "created" : "existing"}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
