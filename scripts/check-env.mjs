#!/usr/bin/env node

const isDeployContext = process.env.VERCEL === "1" || process.env.CI === "true";

const requiredInDeploy = ["AUTH_SECRET", "DATABASE_URL"];

if (process.env.DIRECT_URL !== undefined) requiredInDeploy.push("DIRECT_URL");
if (process.env.CRON_SECRET !== undefined) requiredInDeploy.push("CRON_SECRET");
if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN !== undefined || process.env.NEXT_PUBLIC_MAPBOX_TOKEN !== undefined) {
  requiredInDeploy.push("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
}

if (!isDeployContext) {
  console.log("[check-env] non-deploy context detected; skipping strict checks");
  process.exit(0);
}

const missing = requiredInDeploy.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

if (missing.length) {
  console.error(`[check-env] Missing required env vars for deploy context: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`[check-env] OK (${requiredInDeploy.join(", ")})`);
