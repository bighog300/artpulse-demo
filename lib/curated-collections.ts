import { db } from "@/lib/db";
import { resolveArtworkCoverUrl } from "@/lib/artworks";

export type CuratedCollectionArtwork = {
  id: string;
  slug: string | null;
  title: string;
  artist: { id: string; name: string; slug: string };
  coverUrl: string | null;
};

export type CuratedCollectionPublic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  artworks: CuratedCollectionArtwork[];
};

const artworkSelect = {
  id: true,
  slug: true,
  title: true,
  artist: { select: { id: true, name: true, slug: true } },
  featuredAsset: { select: { url: true } },
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }], take: 1, select: { asset: { select: { url: true } } } },
};

export async function listPublishedCuratedCollections(limitItems = 8): Promise<CuratedCollectionPublic[]> {
  const collections = await db.curatedCollection.findMany({ where: { isPublished: true }, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, title: true, description: true } });
  if (!collections.length) return [];

  const items = await db.curatedCollectionItem.findMany({
    where: { collectionId: { in: collections.map((collection) => collection.id) }, artwork: { isPublished: true } },
    orderBy: [{ collectionId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { collectionId: true, artwork: { select: artworkSelect } },
  });

  const grouped = new Map<string, CuratedCollectionArtwork[]>();
  for (const item of items) {
    const row = grouped.get(item.collectionId) ?? [];
    if (row.length < limitItems) {
      row.push({ id: item.artwork.id, slug: item.artwork.slug, title: item.artwork.title, artist: item.artwork.artist, coverUrl: resolveArtworkCoverUrl(item.artwork) });
    }
    grouped.set(item.collectionId, row);
  }

  return collections.map((collection) => ({ ...collection, artworks: grouped.get(collection.id) ?? [] }));
}

export async function getPublishedCuratedCollectionBySlug(slug: string): Promise<CuratedCollectionPublic | null> {
  const collection = await db.curatedCollection.findFirst({ where: { slug, isPublished: true }, select: { id: true, slug: true, title: true, description: true } });
  if (!collection) return null;
  const items = await db.curatedCollectionItem.findMany({
    where: { collectionId: collection.id, artwork: { isPublished: true } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { artwork: { select: artworkSelect } },
  });

  return {
    ...collection,
    artworks: items.map((item) => ({ id: item.artwork.id, slug: item.artwork.slug, title: item.artwork.title, artist: item.artwork.artist, coverUrl: resolveArtworkCoverUrl(item.artwork) })),
  };
}
