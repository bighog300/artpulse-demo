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
    const error = new Error(`Neon API ${method} ${path} failed (${response.status}): ${msg}`);
    error.status = response.status;
    error.responseBody = text || "";
    error.method = method;
    error.path = path;
    throw error;
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

async function listEndpoints({ projectId, apiKey, branchId }) {
  const allEndpoints = [];
  let cursor = null;

  do {
    const search = new URLSearchParams();
    if (branchId) {
      search.set("branch_id", branchId);
    }
    if (cursor) {
      search.set("cursor", cursor);
    }

    const query = search.toString() ? `?${search.toString()}` : "";
    const result = await neonRequest({
      path: `/projects/${projectId}/endpoints${query}`,
      apiKey,
    });

    allEndpoints.push(...(result?.endpoints || []));

    cursor =
      result?.pagination?.next_cursor ||
      result?.next_cursor ||
      result?.page?.next_cursor ||
      null;
  } while (cursor);

  return branchId
    ? allEndpoints.filter((endpoint) => endpoint.branch_id === branchId)
    : allEndpoints;
}

async function createEndpoint({ projectId, apiKey, branchId }) {
  const existingEndpoints = await listEndpoints({ projectId, apiKey, branchId });
  const existingReadWrite =
    existingEndpoints.find((endpoint) => endpoint.type === "read_write") ||
    existingEndpoints[0] ||
    null;

  if (existingReadWrite) {
    return existingReadWrite;
  }

  try {
    const response = await neonRequest({
      method: "POST",
      path: `/projects/${projectId}/endpoints`,
      apiKey,
      body: {
        endpoint: {
          branch_id: branchId,
          type: "read_write",
        },
      },
    });

    return response?.endpoint || null;
  } catch (error) {
    const status = Number(error?.status) || 0;
    const message = String(error?.message || "").toLowerCase();
    const isAlreadyExistsError = status === 409 || message.includes("(409)") || message.includes("already exists");

    if (isAlreadyExistsError) {
      const refreshedEndpoints = await listEndpoints({ projectId, apiKey, branchId });
      return (
        refreshedEndpoints.find((endpoint) => endpoint.type === "read_write") ||
        refreshedEndpoints[0] ||
        null
      );
    }

    const responseBody = String(error?.responseBody || "");
    const responseBodyShort = responseBody.length > 2000 ? `${responseBody.slice(0, 2000)}…<truncated>` : responseBody;

    let failReason = "ENDPOINT_CREATE_FAILED";
    if (status === 401 || status === 403) {
      failReason = "NEON_AUTH";
    } else if (status === 429) {
      failReason = "NEON_RATE_LIMIT";
    } else if (status >= 400 && status < 500) {
      failReason = "NEON_BAD_REQUEST";
    } else if (status >= 500) {
      failReason = "NEON_SERVER";
    }

    // eslint-disable-next-line no-console
    console.error(
      `FAIL_REASON=${failReason} FAIL_CODE=ENDPOINT_CREATE_FAILED STATUS=${status || "unknown"} RESPONSE_BODY=${responseBodyShort || "<empty>"}`
    );

    error.failReason = failReason;
    error.createEndpointStatus = status || null;
    error.createEndpointBody = responseBodyShort || "";
    throw error;
  }
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
  listEndpoints,
  listBranches,
  maskForGitHubActions,
  neonRequest,
  parseArgs,
  createEndpoint,
};
