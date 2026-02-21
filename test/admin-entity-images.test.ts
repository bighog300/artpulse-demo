import test from "node:test";
import assert from "node:assert/strict";
import { AdminAccessError } from "../lib/admin";
import { withAdminRoute } from "../lib/admin-route";
import { addAdminEntityImage, deleteAdminEntityImage, reorderAdminEntityImages } from "../lib/admin-entity-images-route";
import { db } from "../lib/db";

test("withAdminRoute returns 403 for non-admin", async () => {
  const res = await withAdminRoute(async () => Response.json({ ok: true }), {
    requireAdminFn: async () => { throw new AdminAccessError(403); },
  });
  assert.equal((res as Response).status, 403);
});

test("venue image add/reorder/delete-primary updates sortOrder and featured image", async () => {
  const venue = { id: "11111111-1111-4111-8111-111111111111", featuredImageUrl: null as string | null, featuredAssetId: null as string | null };
  const images: Array<{ id: string; venueId: string; url: string; alt: string | null; sortOrder: number; isPrimary: boolean; createdAt: Date }> = [];
  let idCounter = 1;

  (db as any).adminAuditLog = { create: async () => undefined };
  (db as any).$transaction = async (cb: any) => cb({
    venue: {
      findUnique: async ({ where }: any) => (where.id === venue.id ? { id: venue.id } : null),
      update: async ({ data }: any) => {
        venue.featuredImageUrl = data.featuredImageUrl;
        venue.featuredAssetId = data.featuredAssetId;
        return venue;
      },
    },
    venueImage: {
      findMany: async ({ where }: any) => images.filter((x) => x.venueId === where.venueId || (where.id?.in && where.id.in.includes(x.id))),
      updateMany: async ({ where, data }: any) => {
        images.filter((x) => x.venueId === where.venueId).forEach((x) => { x.isPrimary = data.isPrimary; });
      },
      create: async ({ data }: any) => {
        const row = { id: `img-${idCounter++}`, venueId: data.venueId, url: data.url, alt: data.alt, sortOrder: data.sortOrder, isPrimary: data.isPrimary, createdAt: new Date() };
        images.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = images.find((x) => x.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      findFirst: async ({ where }: any) => images.find((x) => x.id === where.id && x.venueId === where.venueId) ?? null,
      delete: async ({ where }: any) => {
        const idx = images.findIndex((x) => x.id === where.id);
        const [removed] = images.splice(idx, 1);
        return removed;
      },
    },
  });

  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/1.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/2.jpg", makePrimary: true, actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/3.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });

  assert.deepEqual(images.map((x) => x.sortOrder), [0, 1, 2]);
  assert.equal(images.find((x) => x.isPrimary)?.url, "https://example.com/2.jpg");

  const order = [images[2]!.id, images[1]!.id, images[0]!.id];
  await reorderAdminEntityImages({ entityType: "venue", entityId: venue.id, order, actorEmail: "admin@example.com", req: new Request("http://localhost") });
  assert.deepEqual(images.sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.id), order);

  const primaryId = images.find((x) => x.isPrimary)!.id;
  await deleteAdminEntityImage({ entityType: "venue", entityId: venue.id, imageId: primaryId, actorEmail: "admin@example.com", req: new Request("http://localhost") });

  assert.equal(images.length, 2);
  assert.equal(images.filter((x) => x.isPrimary).length, 1);
  assert.equal(venue.featuredImageUrl, images.find((x) => x.isPrimary)?.url ?? null);
});
