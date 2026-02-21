import test from "node:test";
import assert from "node:assert/strict";
import { AdminAccessError } from "../lib/admin";
import { withAdminRoute } from "../lib/admin-route";
import { addAdminEntityImage, deleteAdminEntityImage, patchAdminEntityImage, reorderAdminEntityImages } from "../lib/admin-entity-images-route";
import { db } from "../lib/db";

type VenueImageRow = {
  id: string;
  venueId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
};

test("withAdminRoute returns 403 for non-admin", async () => {
  const res = await withAdminRoute(async () => Response.json({ ok: true }), {
    requireAdminFn: async () => { throw new AdminAccessError(403); },
  });
  assert.equal((res as Response).status, 403);
});

function setupVenueImagesHarness() {
  const venue = { id: "11111111-1111-4111-8111-111111111111", featuredImageUrl: null as string | null, featuredAssetId: null as string | null };
  const images: VenueImageRow[] = [];
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
      findMany: async ({ where }: any = {}) => {
        let rows = [...images];
        if (where?.venueId) rows = rows.filter((x) => x.venueId === where.venueId);
        if (where?.id?.in) rows = rows.filter((x) => where.id.in.includes(x.id));
        return rows.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
      },
      updateMany: async ({ where, data }: any) => {
        images.filter((x) => x.venueId === where.venueId).forEach((x) => { x.isPrimary = data.isPrimary; });
      },
      create: async ({ data }: any) => {
        const row = {
          id: `img-${idCounter++}`,
          venueId: data.venueId,
          url: data.url,
          alt: data.alt,
          sortOrder: data.sortOrder,
          isPrimary: data.isPrimary,
          createdAt: new Date(idCounter),
        };
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

  return { venue, images };
}

test("reorder rejects stale/malformed payloads with strict validation", async () => {
  const { venue, images } = setupVenueImagesHarness();

  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/1.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/2.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/3.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });

  const missingOne = await reorderAdminEntityImages({
    entityType: "venue",
    entityId: venue.id,
    order: [images[0]!.id, images[1]!.id],
    actorEmail: "admin@example.com",
    req: new Request("http://localhost"),
  });

  assert.equal(missingOne.status, 400);
  assert.equal((await missingOne.json()).error.code, "invalid_request");

  const duplicateId = await reorderAdminEntityImages({
    entityType: "venue",
    entityId: venue.id,
    order: [images[0]!.id, images[0]!.id, images[2]!.id],
    actorEmail: "admin@example.com",
    req: new Request("http://localhost"),
  });

  assert.equal(duplicateId.status, 400);
  assert.equal((await duplicateId.json()).error.message, "Order payload must include every image id exactly once.");
});

test("delete normalizes sort order and setPrimary keeps single primary invariant", async () => {
  const { venue, images } = setupVenueImagesHarness();

  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/1.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/2.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await addAdminEntityImage({ entityType: "venue", entityId: venue.id, url: "https://example.com/3.jpg", actorEmail: "admin@example.com", req: new Request("http://localhost") });

  await deleteAdminEntityImage({ entityType: "venue", entityId: venue.id, imageId: images[1]!.id, actorEmail: "admin@example.com", req: new Request("http://localhost") });

  const sortedRemaining = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  assert.deepEqual(sortedRemaining.map((x) => x.sortOrder), [0, 1]);

  await patchAdminEntityImage({ entityType: "venue", entityId: venue.id, imageId: sortedRemaining[0]!.id, isPrimary: true, actorEmail: "admin@example.com", req: new Request("http://localhost") });
  await patchAdminEntityImage({ entityType: "venue", entityId: venue.id, imageId: sortedRemaining[1]!.id, isPrimary: true, actorEmail: "admin@example.com", req: new Request("http://localhost") });

  assert.equal(images.filter((x) => x.isPrimary).length, 1);
  assert.equal(venue.featuredImageUrl, images.find((x) => x.isPrimary)?.url ?? null);
});
