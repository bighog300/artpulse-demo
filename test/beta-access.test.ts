import test from "node:test";
import assert from "node:assert/strict";
import { getBetaConfig, isEmailAllowed, normalizeEmail, parseAllowlist, parseDomains } from "../lib/beta/access.ts";

test("beta email allowlist supports exact match, domains, and admin override", () => {
  const config = {
    betaMode: true,
    requestsEnabled: true,
    allowlist: parseAllowlist("allow@example.com"),
    allowDomains: parseDomains("beta.example.org"),
    adminEmails: parseAllowlist("admin@example.net"),
  };

  assert.equal(isEmailAllowed("allow@example.com", config), true);
  assert.equal(isEmailAllowed("person@beta.example.org", config), true);
  assert.equal(isEmailAllowed("admin@example.net", config), true);
  assert.equal(isEmailAllowed("blocked@example.com", config), false);
});

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  TeSt@Example.COM "), "test@example.com");
});

test("getBetaConfig reads env toggles", () => {
  process.env.BETA_MODE = "1";
  process.env.BETA_REQUESTS_ENABLED = "0";
  process.env.BETA_ALLOWLIST = "first@example.com";
  process.env.BETA_ALLOW_DOMAINS = "domain.test";
  process.env.BETA_ADMIN_EMAILS = "admin@test.com";

  const config = getBetaConfig();
  assert.equal(config.betaMode, true);
  assert.equal(config.requestsEnabled, false);
  assert.equal(config.allowlist.has("first@example.com"), true);
  assert.equal(config.allowDomains.has("domain.test"), true);
  assert.equal(config.adminEmails.has("admin@test.com"), true);
});
