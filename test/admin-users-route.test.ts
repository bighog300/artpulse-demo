import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminUsersSearch, handleAdminUserRoleUpdate } from "../lib/admin-users-route.ts";

type Role = "USER" | "EDITOR" | "ADMIN";

type MockUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt?: Date;
};

function buildDeps(users: MockUser[]) {
  const auditEntries: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      count: async ({ where }: { where: { role: Role } }) => users.filter((user) => user.role === where.role).length,
      update: async ({ where, data }: { where: { id: string }; data: { role: Role } }) => {
        const idx = users.findIndex((user) => user.id === where.id);
        if (idx < 0) throw new Error("not_found");
        users[idx] = { ...users[idx], role: data.role };
        return { id: users[idx].id, email: users[idx].email, name: users[idx].name, role: users[idx].role };
      },
    },
    adminAuditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditEntries.push(data);
      },
    },
  };

  const appDb = {
    user: {
      findMany: async ({ where }: { where?: { OR: Array<{ email?: { contains: string } ; name?: { contains: string } }> } }) => {
        const query = where?.OR?.[0]?.email?.contains ?? where?.OR?.[1]?.name?.contains ?? "";
        const lowered = query.toLowerCase();
        return users
          .filter((user) => {
            if (!query) return true;
            return user.email.toLowerCase().includes(lowered) || (user.name ?? "").toLowerCase().includes(lowered);
          })
          .map((user) => ({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt ?? new Date() }));
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const user = users.find((item) => item.id === where.id);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    },
    adminAuditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditEntries.push(data);
      },
    },
    $transaction: async <T>(fn: (innerTx: typeof tx) => Promise<T>) => fn(tx),
  } as const;

  return { appDb, auditEntries };
}

test("GET /api/admin/users allows admins to search users", async () => {
  const { appDb } = buildDeps([
    { id: "11111111-1111-4111-8111-111111111111", email: "alice@example.com", name: "Alice", role: "USER" },
    { id: "22222222-2222-4222-8222-222222222222", email: "bob@example.com", name: "Bob", role: "EDITOR" },
  ]);

  const req = new NextRequest("http://localhost/api/admin/users?query=ali");
  const res = await handleAdminUsersSearch(req, {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.users.length, 1);
  assert.equal(body.users[0].email, "alice@example.com");
});

test("GET /api/admin/users returns 403 for non-admin", async () => {
  const { appDb } = buildDeps([]);
  const req = new NextRequest("http://localhost/api/admin/users");

  const res = await handleAdminUsersSearch(req, {
    requireAdminUser: async () => {
      throw new Error("forbidden");
    },
    appDb: appDb as never,
  });

  assert.equal(res.status, 403);
});

test("PATCH /api/admin/users/[id]/role lets admin update another user's role", async () => {
  const { appDb } = buildDeps([
    { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", name: "Admin", role: "ADMIN" },
    { id: "22222222-2222-4222-8222-222222222222", email: "editor@example.com", name: "Editor", role: "EDITOR" },
  ]);

  const req = new NextRequest("http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222/role", {
    method: "PATCH",
    body: JSON.stringify({ role: "USER" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminUserRoleUpdate(req, { id: "22222222-2222-4222-8222-222222222222" }, {
    requireAdminUser: async () => ({ id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.role, "USER");
});

test("PATCH /api/admin/users/[id]/role prevents demoting the last admin", async () => {
  const { appDb } = buildDeps([
    { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", name: "Admin", role: "ADMIN" },
  ]);

  const req = new NextRequest("http://localhost/api/admin/users/11111111-1111-4111-8111-111111111111/role", {
    method: "PATCH",
    body: JSON.stringify({ role: "USER" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminUserRoleUpdate(req, { id: "11111111-1111-4111-8111-111111111111" }, {
    requireAdminUser: async () => ({ id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 409);
});

test("PATCH /api/admin/users/[id]/role writes an audit log entry on success", async () => {
  const { appDb, auditEntries } = buildDeps([
    { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", name: "Admin", role: "ADMIN" },
    { id: "22222222-2222-4222-8222-222222222222", email: "user@example.com", name: "User", role: "USER" },
  ]);

  const req = new NextRequest("http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222/role", {
    method: "PATCH",
    body: JSON.stringify({ role: "EDITOR" }),
    headers: { "content-type": "application/json", "user-agent": "node-test" },
  });

  const res = await handleAdminUserRoleUpdate(req, { id: "22222222-2222-4222-8222-222222222222" }, {
    requireAdminUser: async () => ({ id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", role: "ADMIN" }),
    appDb: appDb as never,
  });

  assert.equal(res.status, 200);
  assert.equal(auditEntries.length, 1);
  assert.equal(auditEntries[0].action, "USER_ROLE_CHANGED");
});
