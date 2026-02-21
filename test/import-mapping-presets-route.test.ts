import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  handleImportMappingPresetDelete,
  handleImportMappingPresetList,
  handleImportMappingPresetSave,
} from "../lib/admin-import-mapping-presets-route.ts";

type Preset = {
  id: string;
  createdById: string;
  entityType: "venues" | "events" | "artists";
  name: string;
  mappingJson: Record<string, string>;
  updatedAt: Date;
  createdAt: Date;
};

function buildDeps() {
  const now = new Date("2026-03-16T12:00:00.000Z");
  const presets: Preset[] = [];
  const auditEntries: Array<Record<string, unknown>> = [];

  const tx = {
    importMappingPreset: {
      create: async ({ data }: { data: Omit<Preset, "id" | "createdAt" | "updatedAt"> & { mappingJson: Record<string, string> } }) => {
        const preset: Preset = {
          id: `00000000-0000-4000-8000-${String(presets.length + 1).padStart(12, "0")}`,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        presets.push(preset);
        return { id: preset.id, name: preset.name, entityType: preset.entityType, mappingJson: preset.mappingJson, updatedAt: preset.updatedAt };
      },
      update: async ({ where, data }: { where: { id: string }; data: { mappingJson: Record<string, string> } }) => {
        const preset = presets.find((item) => item.id === where.id);
        if (!preset) throw new Error("not_found");
        preset.mappingJson = data.mappingJson;
        preset.updatedAt = new Date(now.getTime() + 1000);
        return { id: preset.id, name: preset.name, entityType: preset.entityType, mappingJson: preset.mappingJson, updatedAt: preset.updatedAt };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = presets.findIndex((item) => item.id === where.id);
        if (index >= 0) presets.splice(index, 1);
      },
    },
    adminAuditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditEntries.push(data);
      },
    },
  };

  const appDb = {
    importMappingPreset: {
      findMany: async ({ where }: { where: { createdById: string; entityType: string } }) => presets.filter((item) => item.createdById === where.createdById && item.entityType === where.entityType),
      findUnique: async ({ where }: { where: { id?: string; createdById_entityType_name?: { createdById: string; entityType: string; name: string } } }) => {
        if (where.id) return presets.find((item) => item.id === where.id) ?? null;
        const unique = where.createdById_entityType_name;
        if (!unique) return null;
        return presets.find((item) => item.createdById === unique.createdById && item.entityType === unique.entityType && item.name === unique.name) ?? null;
      },
      ...tx.importMappingPreset,
    },
    adminAuditLog: tx.adminAuditLog,
    $transaction: async <T>(fn: (inner: typeof tx) => Promise<T>) => fn(tx),
  } as const;

  return { appDb, presets, auditEntries };
}

const adminA = async () => ({ id: "00000000-0000-4000-8000-000000000001", email: "admin-a@example.com", role: "ADMIN" as const });
const adminB = async () => ({ id: "00000000-0000-4000-8000-000000000002", email: "admin-b@example.com", role: "ADMIN" as const });

test("non-admin gets 403 for list/create/delete", async () => {
  const { appDb } = buildDeps();
  const nonAdmin = async () => { throw new Error("forbidden"); };

  const listRes = await handleImportMappingPresetList(new NextRequest("http://localhost/api/admin/import-mapping-presets?entityType=venues"), { requireAdminUser: nonAdmin, appDb: appDb as never });
  assert.equal(listRes.status, 403);

  const createRes = await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "venues", name: "default", mapping: { title: "name" } }),
  }), { requireAdminUser: nonAdmin, appDb: appDb as never });
  assert.equal(createRes.status, 403);

  const deleteRes = await handleImportMappingPresetDelete(new NextRequest("http://localhost/api/admin/import-mapping-presets/00000000-0000-4000-8000-000000000001", { method: "DELETE" }), { id: "00000000-0000-4000-8000-000000000001" }, { requireAdminUser: nonAdmin, appDb: appDb as never });
  assert.equal(deleteRes.status, 403);
});

test("admin creates preset and DB stores mappingJson", async () => {
  const { appDb, presets } = buildDeps();
  const res = await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "venues", name: "My Venue Map", mapping: { venue_name: "name", skip_me: null, ignored: "__ignore" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  assert.equal(res.status, 200);
  assert.deepEqual(presets[0]?.mappingJson, { venue_name: "name" });
});

test("duplicate name without overwrite returns 409", async () => {
  const { appDb } = buildDeps();
  await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "events", name: "Events", mapping: { col1: "title" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  const duplicate = await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "events", name: "Events", mapping: { col2: "startAt" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  assert.equal(duplicate.status, 409);
});

test("overwrite updates mappingJson", async () => {
  const { appDb, presets } = buildDeps();
  await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "artists", name: "Artists", mapping: { c1: "name" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  const overwrite = await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "artists", name: "Artists", mapping: { c2: "bio" }, overwrite: true }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  assert.equal(overwrite.status, 200);
  assert.deepEqual(presets[0]?.mappingJson, { c2: "bio" });
});

test("list returns only caller presets", async () => {
  const { appDb } = buildDeps();
  await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "venues", name: "Preset A", mapping: { c1: "name" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });
  await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "venues", name: "Preset B", mapping: { c1: "name" } }),
  }), { requireAdminUser: adminB, appDb: appDb as never });

  const res = await handleImportMappingPresetList(new NextRequest("http://localhost/api/admin/import-mapping-presets?entityType=venues"), { requireAdminUser: adminA, appDb: appDb as never });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.presets.length, 1);
  assert.equal(body.presets[0].name, "Preset A");
});

test("delete works and audit rows are created for save/delete", async () => {
  const { appDb, auditEntries } = buildDeps();
  const createRes = await handleImportMappingPresetSave(new NextRequest("http://localhost/api/admin/import-mapping-presets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entityType: "venues", name: "DeleteMe", mapping: { c1: "slug" } }),
  }), { requireAdminUser: adminA, appDb: appDb as never });

  const created = await createRes.json();
  const delRes = await handleImportMappingPresetDelete(new NextRequest(`http://localhost/api/admin/import-mapping-presets/${created.id}`, { method: "DELETE" }), { id: created.id }, { requireAdminUser: adminA, appDb: appDb as never });

  assert.equal(delRes.status, 200);
  assert.equal(auditEntries.filter((entry) => entry.action === "ADMIN_IMPORT_PRESET_SAVED").length, 1);
  assert.equal(auditEntries.filter((entry) => entry.action === "ADMIN_IMPORT_PRESET_DELETED").length, 1);
});
