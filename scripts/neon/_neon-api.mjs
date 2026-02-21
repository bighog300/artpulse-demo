import fs from "node:fs";

const NEON_BASE_URL = "https://console.neon.tech/api/v2";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getProjectId(args) {
  return args["project-id"] || process.env.NEON_PROJECT_ID || requiredEnv("NEON_PROJECT_ID");
}

function getApiKey(args) {
  return args["api-key"] || process.env.NEON_API_KEY || requiredEnv("NEON_API_KEY");
}

async function neonRequest({ method = "GET", path, apiKey, body }) {
  const response = await fetch(`${NEON_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!response.ok) {
    const msg = json?.message || json?.error || JSON.stringify(json) || response.statusText;
    throw new Error(`Neon API ${method} ${path} failed (${response.status}): ${msg}`);
  }

  return json;
}

async function listBranches({ projectId, apiKey }) {
  const allBranches = [];
  let cursor = null;

  // Neon list endpoints may paginate; collect every page so branch lookups are reliable.
  do {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const result = await neonRequest({
      path: `/projects/${projectId}/branches${query}`,
      apiKey,
    });

    allBranches.push(...(result?.branches || []));

    cursor =
      result?.pagination?.next_cursor ||
      result?.next_cursor ||
      result?.page?.next_cursor ||
      null;
  } while (cursor);

  return allBranches;
}

function pickBranchByName(branches, branchName) {
  return (branches || []).find((branch) => branch.name === branchName) || null;
}

async function getBranchByName({ projectId, apiKey, branchName }) {
  const branches = await listBranches({ projectId, apiKey });
  return pickBranchByName(branches, branchName);
}

function appendGitHubOutput(key, value) {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) return;
  fs.appendFileSync(outPath, `${key}=${value}\n`);
}

function maskForGitHubActions(value) {
  if (!value) return;
  console.log(`::add-mask::${value}`);
}

export {
  appendGitHubOutput,
  getApiKey,
  getBranchByName,
  getProjectId,
  listBranches,
  maskForGitHubActions,
  neonRequest,
  parseArgs,
};
