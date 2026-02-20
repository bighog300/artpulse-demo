import test from "node:test";
import assert from "node:assert/strict";
import { authOptions } from "../lib/auth.ts";
import { db } from "../lib/db.ts";

const originalUpsert = db.user.upsert;

test("auth signIn denies when beta mode enabled with empty allowlist", async () => {
  process.env.BETA_MODE = "1";
  process.env.BETA_ALLOWLIST = "";
  process.env.BETA_ALLOW_DOMAINS = "";
  process.env.BETA_ADMIN_EMAILS = "";

  db.user.upsert = (async () => ({ id: "user-1" })) as typeof db.user.upsert;

  const result = await authOptions.callbacks!.signIn!({ user: { email: "blocked@example.com", name: null, image: null } as never, account: null as never, profile: undefined, email: undefined, credentials: undefined });
  assert.equal(result, false);
});

test("auth signIn allows allowlisted email in beta mode", async () => {
  process.env.BETA_MODE = "1";
  process.env.BETA_ALLOWLIST = "allow@example.com";
  process.env.BETA_ALLOW_DOMAINS = "";
  process.env.BETA_ADMIN_EMAILS = "";

  let upsertCalled = false;
  db.user.upsert = (async () => {
    upsertCalled = true;
    return { id: "user-1" };
  }) as typeof db.user.upsert;

  const result = await authOptions.callbacks!.signIn!({ user: { email: "allow@example.com", name: null, image: null } as never, account: null as never, profile: undefined, email: undefined, credentials: undefined });
  assert.equal(result, true);
  assert.equal(upsertCalled, true);
});

test.after(() => {
  db.user.upsert = originalUpsert;
  delete process.env.BETA_MODE;
  delete process.env.BETA_ALLOWLIST;
  delete process.env.BETA_ALLOW_DOMAINS;
  delete process.env.BETA_ADMIN_EMAILS;
});
