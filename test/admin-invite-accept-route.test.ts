import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminInviteAccept } from "../lib/admin-invite-accept-route.ts";
import { hashInviteToken } from "../lib/admin-invites-route.ts";

type Role = "USER" | "EDITOR" | "ADMIN";

type Invite = {
  id: string;
  normalizedEmail: string;
  intendedRole: Role;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  tokenHash: string;
};

function buildDeps(invite: Invite | null, role: Role = "USER") {
  const auditEntries: any[] = [];
  const user = { id: "user-1", email: "member@example.com", role };

  const tx = {
    user: {
      findUnique: async () => user,
      update: async ({ data }: any) => {
        user.role = data.role;
        return { role: user.role };
      },
    },
    adminInvite: {
      update: async ({ data }: any) => {
        if (invite) invite.acceptedAt = data.acceptedAt;
      },
    },
    adminAuditLog: { create: async ({ data }: any) => void auditEntries.push(data) },
  };

  const appDb = {
    adminInvite: {
      findUnique: async ({ where }: any) => {
        if (!invite) return null;
        return invite.tokenHash === where.tokenHash ? invite : null;
      },
    },
    $transaction: async <T>(fn: (innerTx: typeof tx) => Promise<T>) => fn(tx),
  } as const;

  return { appDb, user, auditEntries };
}

test("accept invite requires auth", async () => {
  const req = new NextRequest("http://localhost/api/invite/accept", { method: "POST", body: JSON.stringify({ token: "x".repeat(40) }) });
  const res = await handleAdminInviteAccept(req, {
    requireUser: async () => {
      throw new Error("unauthorized");
    },
    appDb: {} as never,
  });
  assert.equal(res.status, 401);
});

test("accept invite fails for email mismatch", async () => {
  const invite = { id: "i1", normalizedEmail: "other@example.com", intendedRole: "EDITOR" as Role, expiresAt: new Date(Date.now() + 60_000), acceptedAt: null, revokedAt: null, tokenHash: hashInviteToken("t".repeat(40)) };
  const { appDb } = buildDeps(invite);
  const req = new NextRequest("http://localhost/api/invite/accept", { method: "POST", body: JSON.stringify({ token: "t".repeat(40) }), headers: { "content-type": "application/json" } });
  const res = await handleAdminInviteAccept(req, { requireUser: async () => ({ id: "user-1", email: "member@example.com", role: "USER" }), appDb: appDb as never });
  assert.equal(res.status, 403);
});

test("accept invite fails if expired or revoked", async () => {
  const expiredInvite = { id: "i1", normalizedEmail: "member@example.com", intendedRole: "EDITOR" as Role, expiresAt: new Date(Date.now() - 1), acceptedAt: null, revokedAt: null, tokenHash: hashInviteToken("a".repeat(40)) };
  const revokedInvite = { ...expiredInvite, id: "i2", expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date() };

  const expiredReq = new NextRequest("http://localhost/api/invite/accept", { method: "POST", body: JSON.stringify({ token: "a".repeat(40) }), headers: { "content-type": "application/json" } });
  const expiredRes = await handleAdminInviteAccept(expiredReq, { requireUser: async () => ({ id: "user-1", email: "member@example.com", role: "USER" }), appDb: buildDeps(expiredInvite).appDb as never });
  assert.equal(expiredRes.status, 409);

  const revokedReq = new NextRequest("http://localhost/api/invite/accept", { method: "POST", body: JSON.stringify({ token: "a".repeat(40) }), headers: { "content-type": "application/json" } });
  const revokedRes = await handleAdminInviteAccept(revokedReq, { requireUser: async () => ({ id: "user-1", email: "member@example.com", role: "USER" }), appDb: buildDeps(revokedInvite).appDb as never });
  assert.equal(revokedRes.status, 409);
});

test("accept invite upgrades role and writes audit", async () => {
  const invite = { id: "i1", normalizedEmail: "member@example.com", intendedRole: "EDITOR" as Role, expiresAt: new Date(Date.now() + 60_000), acceptedAt: null, revokedAt: null, tokenHash: hashInviteToken("z".repeat(40)) };
  const { appDb, user, auditEntries } = buildDeps(invite, "USER");

  const req = new NextRequest("http://localhost/api/invite/accept", {
    method: "POST",
    body: JSON.stringify({ token: "z".repeat(40) }),
    headers: { "content-type": "application/json", "user-agent": "node-test" },
  });
  const res = await handleAdminInviteAccept(req, {
    requireUser: async () => ({ id: "user-1", email: "member@example.com", role: "USER" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.role, "EDITOR");
  assert.equal(user.role, "EDITOR");
  assert.equal(auditEntries.length, 1);
  assert.equal(auditEntries[0].action, "ADMIN_INVITE_ACCEPTED");
});
