import { Prisma, type PrismaClient } from "@prisma/client";
import { ASSOCIATION_ROLES, isRoleKey, type AssociationRoleKey } from "@/lib/association-roles";

export type AssocCounts = {
  any: number;
  verified: number;
  exhibitions: number;
  none: number;
};

export type RoleCounts = Record<AssociationRoleKey | "all", number>;

type DbClient = PrismaClient;

type RawRoleCountRow = {
  role: string | null;
  count: number | bigint;
};

export function normalizeRoleFacetKey(role: string | null): AssociationRoleKey {
  if (!role) return "other";
  return isRoleKey(role) ? role : "other";
}

export function bucketRoleFacetCounts(rows: RawRoleCountRow[]): RoleCounts {
  const counts = Object.fromEntries([...ASSOCIATION_ROLES, "all"].map((key) => [key, 0])) as RoleCounts;

  for (const row of rows) {
    const normalizedRole = normalizeRoleFacetKey(row.role);
    const value = Number(row.count ?? 0);
    counts[normalizedRole] += value;
    counts.all += value;
  }

  return counts;
}

export async function getArtistAssocCounts(db: DbClient): Promise<AssocCounts> {
  const [any, verified, exhibitions, none] = await Promise.all([
    db.artist.count({ where: { isPublished: true } }),
    db.artist.count({
      where: {
        isPublished: true,
        venueAssociations: {
          some: { status: "APPROVED" },
        },
      },
    }),
    db.artist.count({
      where: {
        isPublished: true,
        eventArtists: {
          some: {
            event: { isPublished: true },
          },
        },
      },
    }),
    db.artist.count({
      where: {
        isPublished: true,
        AND: [{ venueAssociations: { none: { status: "APPROVED" } } }, { eventArtists: { none: { event: { isPublished: true } } } }],
      },
    }),
  ]);

  return { any, verified, exhibitions, none };
}

export async function getVenueAssocCounts(db: DbClient): Promise<AssocCounts> {
  const [any, verified, exhibitions, none] = await Promise.all([
    db.venue.count({ where: { isPublished: true } }),
    db.venue.count({
      where: {
        isPublished: true,
        artistAssociations: {
          some: { status: "APPROVED" },
        },
      },
    }),
    db.venue.count({
      where: {
        isPublished: true,
        events: {
          some: {
            isPublished: true,
            eventArtists: { some: {} },
          },
        },
      },
    }),
    db.venue.count({
      where: {
        isPublished: true,
        AND: [
          { artistAssociations: { none: { status: "APPROVED" } } },
          { events: { none: { isPublished: true, eventArtists: { some: {} } } } },
        ],
      },
    }),
  ]);

  return { any, verified, exhibitions, none };
}

export async function getArtistRoleFacetCounts(db: DbClient): Promise<RoleCounts> {
  const rows = await db.$queryRaw<RawRoleCountRow[]>(Prisma.sql`
    SELECT ava.role, COUNT(DISTINCT ava."artistId")::int AS count
    FROM "ArtistVenueAssociation" ava
    INNER JOIN "Artist" a ON a.id = ava."artistId"
    WHERE ava.status = 'APPROVED' AND a."isPublished" = true
    GROUP BY ava.role
  `);

  return bucketRoleFacetCounts(rows);
}

export async function getVenueRoleFacetCounts(db: DbClient): Promise<RoleCounts> {
  const rows = await db.$queryRaw<RawRoleCountRow[]>(Prisma.sql`
    SELECT ava.role, COUNT(DISTINCT ava."venueId")::int AS count
    FROM "ArtistVenueAssociation" ava
    INNER JOIN "Venue" v ON v.id = ava."venueId"
    WHERE ava.status = 'APPROVED' AND v."isPublished" = true
    GROUP BY ava.role
  `);

  return bucketRoleFacetCounts(rows);
}
