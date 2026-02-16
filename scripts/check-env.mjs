#!/usr/bin/env node

const required = ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET"];
const optionalRequired = [];

if (process.env.NEXTAUTH_URL !== undefined || process.env.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_SECRET || process.env.CI === "true") {
  optionalRequired.push("NEXTAUTH_URL");
}

if (process.env.CRON_SECRET !== undefined || process.env.CI === "true") {
  optionalRequired.push("CRON_SECRET");
}

const missing = [...required, ...optionalRequired].filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

if (missing.length) {
  console.error(`[check-env] Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`[check-env] OK (${[...required, ...optionalRequired].join(", ")})`);
