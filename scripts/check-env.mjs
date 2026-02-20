#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function hasVercelCrons() {
  try {
    const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.crons) && parsed.crons.length > 0;
  } catch {
    return false;
  }
}

const isDeployContext = process.env.VERCEL === "1" || process.env.CI === "true";

const requiredInDeploy = ["AUTH_SECRET", "DATABASE_URL"];
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (process.env.DIRECT_URL !== undefined) requiredInDeploy.push("DIRECT_URL");
if (hasVercelCrons()) requiredInDeploy.push("CRON_SECRET");

if (!isDeployContext) {
  console.log("[check-env] non-deploy context detected; skipping strict checks");
  process.exit(0);
}

const missing = requiredInDeploy.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

if ((mapboxToken !== undefined || mapboxAccessToken !== undefined)
  && (!mapboxToken || String(mapboxToken).trim().length === 0)
  && (!mapboxAccessToken || String(mapboxAccessToken).trim().length === 0)) {
  missing.push("NEXT_PUBLIC_MAPBOX_TOKEN|NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
}

if (missing.length) {
  console.error(`[check-env] Missing required env vars for deploy context: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`[check-env] OK (${requiredInDeploy.join(", ")})`);
