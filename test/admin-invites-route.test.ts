import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminInviteCreate } from "../lib/admin-invites-route.ts";

type Role = "USER" | "EDITOR" | "ADMIN";

type Invite = {
  id: string;
  email: string;
  normalizedEmail: string;
  intendedRole: Role;
  tokenHash: string;
  createdById: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
};

function buildDeps() {
  const invites: Invite[] = [];
  const auditEntries: Array<Record<string, unknown>> = [];
  let seq = 1;

  const tx = {
    adminInvite: {
      upsert: async ({ where, create, update }: any) => {
        const found = invites.find((item) => item.normalizedEmail === where.normalizedEmail);
        if (found) {
          Object.assign(found, update);
          return { id: found.id, email: found.email, intendedRole: found.intendedRole, expiresAt: found.expiresAt };
        }
        const next = { id: `invite-${seq++}`, createdAt: create.createdAt ?? new Date(), acceptedAt: null, revokedAt: null, ...create };
        invites.push(next);
        return { id: next.id, email: next.email, intendedRole: next.intendedRole, expiresAt: next.expiresAt };
      },
    },
    adminAuditLog: { create: async ({ data }: any) => void auditEntries.push(data) },
  };

  const appDb = {
    adminInvite: {
      findUnique: async ({ where }: any) => invites.find((item) => item.normalizedEmail === where.normalizedEmail) ?? null,
    },
    $transaction: async <T>(fn: (innerTx: typeof tx) => Promise<T>) => fn(tx),
  } as const;

  return { appDb, invites, auditEntries };
}

test("admin can create invite with raw token URL while storing only token hash", async () => {
  const { appDb, invites, auditEntries } = buildDeps();

  const req = new NextRequest("http://localhost/api/admin/invites", {
    method: "POST",
    body: JSON.stringify({ email: "Editor@Example.com", role: "EDITOR" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminInviteCreate(req, {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.inviteUrl.startsWith("http://localhost/invite/"));
  assert.equal(invites.length, 1);
  assert.notEqual(invites[0].tokenHash, body.inviteUrl.split("/").at(-1));
  assert.equal(auditEntries[0].action, "ADMIN_INVITE_CREATED");
});

test("non-admin cannot create invite", async () => {
  const { appDb } = buildDeps();

  const req = new NextRequest("http://localhost/api/admin/invites", {
    method: "POST",
    body: JSON.stringify({ email: "editor@example.com" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminInviteCreate(req, {
    requireAdminUser: async () => {
      throw new Error("forbidden");
    },
    appDb: appDb as never,
  });

  assert.equal(res.status, 403);
});

test("create invite is idempotent for active invite", async () => {
  const { appDb } = buildDeps();

  const requestA = new NextRequest("http://localhost/api/admin/invites", {
    method: "POST",
    body: JSON.stringify({ email: "editor@example.com" }),
    headers: { "content-type": "application/json" },
  });
  const first = await handleAdminInviteCreate(requestA, {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });
  const firstBody = await first.json();

  const requestB = new NextRequest("http://localhost/api/admin/invites", {
    method: "POST",
    body: JSON.stringify({ email: "editor@example.com", role: "ADMIN" }),
    headers: { "content-type": "application/json" },
  });
  const second = await handleAdminInviteCreate(requestB, {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });
  const secondBody = await second.json();

  assert.equal(secondBody.inviteId, firstBody.inviteId);
  assert.equal(secondBody.reused, true);
  assert.equal(secondBody.inviteUrl, null);
});
