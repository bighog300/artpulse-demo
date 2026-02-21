#!/usr/bin/env node
import {
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
  const ifExists = Boolean(args["if-exists"]);

  if (!branchName) {
    throw new Error("Missing required --branch-name");
  }

  const branch = await getBranchByName({ projectId, apiKey, branchName });
  if (!branch) {
    if (ifExists) {
      console.log(`set-env OK: Neon branch \"${branchName}\" already absent.`);
      return;
    }
    throw new Error(`Branch \"${branchName}\" not found.`);
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

    console.log(`set-env OK: Neon branch \"${branchName}\" already absent.`);
    return;
  }

  console.log(`set-env OK: Neon branch \"${branchName}\" deleted.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
