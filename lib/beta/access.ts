export type BetaConfig = {
  betaMode: boolean;
  requestsEnabled: boolean;
  allowlist: Set<string>;
  allowDomains: Set<string>;
  adminEmails: Set<string>;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseCsv(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAllowlist(value?: string) {
  return new Set(parseCsv(value).map(normalizeEmail));
}

export function parseDomains(value?: string) {
  return new Set(parseCsv(value).map((item) => item.toLowerCase()));
}

export function getBetaConfig(): BetaConfig {
  return {
    betaMode: process.env.BETA_MODE === "1",
    requestsEnabled: process.env.BETA_MODE === "1" ? process.env.BETA_REQUESTS_ENABLED !== "0" : false,
    allowlist: parseAllowlist(process.env.BETA_ALLOWLIST),
    allowDomains: parseDomains(process.env.BETA_ALLOW_DOMAINS),
    adminEmails: parseAllowlist(process.env.BETA_ADMIN_EMAILS),
  };
}

export function isEmailAllowed(email: string, config: BetaConfig = getBetaConfig()) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (config.adminEmails.has(normalized)) return true;
  if (config.allowlist.has(normalized)) return true;
  const domain = normalized.split("@")[1];
  if (!domain) return false;
  if (config.allowDomains.has(domain)) return true;
  return false;
}
