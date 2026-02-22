import { db } from "@/lib/db";
import { computeArtworkCompleteness } from "@/lib/artwork-completeness";

export async function getCollectionPreview(collectionId: string) {
  const collection = await db.curatedCollection.findUnique({
    where: { id: collectionId },
    select: { id: true, slug: true, title: true, description: true, isPublished: true },
  });
  if (!collection) return null;

  const items = await db.curatedCollectionItem.findMany({
    where: { collectionId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      artwork: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
          featuredAssetId: true,
          description: true,
          medium: true,
          year: true,
          images: { select: { id: true }, take: 1 },
          _count: { select: { images: true } },
        },
      },
    },
  });

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);
  start.setUTCHours(0, 0, 0, 0);
  const ids = items.map((item) => item.artwork.id);
  const viewRows = ids.length
    ? await db.pageViewDaily.groupBy({ by: ["entityId"], where: { entityType: "ARTWORK", entityId: { in: ids }, day: { gte: start } }, _sum: { views: true } })
    : [];
  const viewsById = new Map(viewRows.map((row) => [row.entityId, Number(row._sum.views ?? 0)]));

  return {
    collection,
    items: items.map((item) => {
      const completeness = computeArtworkCompleteness(item.artwork, item.artwork._count.images);
      return {
        artworkId: item.artwork.id,
        title: item.artwork.title,
        slug: item.artwork.slug,
        isPublished: item.artwork.isPublished,
        coverOk: Boolean(item.artwork.featuredAssetId) || item.artwork.images.length > 0,
        completeness: {
          requiredOk: completeness.required.ok,
          scorePct: completeness.scorePct,
          requiredIssues: completeness.required.issues,
        },
        views30: viewsById.get(item.artwork.id) ?? 0,
      };
    }),
  };
}

export async function getCurationQaSummary() {
  const [collections, items] = await Promise.all([
    db.curatedCollection.findMany({ select: { id: true, title: true, slug: true, isPublished: true } }),
    db.curatedCollectionItem.findMany({
      select: {
        collectionId: true,
        artworkId: true,
        artwork: {
          select: {
            id: true,
            title: true,
            slug: true,
            isPublished: true,
            featuredAssetId: true,
            description: true,
            medium: true,
            year: true,
            _count: { select: { images: true } },
          },
        },
      },
    }),
  ]);

  const collectionMap = new Map(collections.map((c) => [c.id, c]));
  const itemsByCollection = new Map<string, typeof items>();
  const collectionsByArtwork = new Map<string, string[]>();

  for (const item of items) {
    const list = itemsByCollection.get(item.collectionId) ?? [];
    list.push(item);
    itemsByCollection.set(item.collectionId, list);

    const seen = collectionsByArtwork.get(item.artworkId) ?? [];
    seen.push(item.collectionId);
    collectionsByArtwork.set(item.artworkId, seen);
  }

  const duplicates = Array.from(collectionsByArtwork.entries())
    .filter(([, ids]) => new Set(ids).size > 1)
    .map(([artworkId, ids]) => {
      const first = items.find((item) => item.artworkId === artworkId)?.artwork;
      const uniqueIds = Array.from(new Set(ids));
      return {
        artworkId,
        title: first?.title ?? "Untitled",
        slug: first?.slug ?? null,
        collections: uniqueIds.map((id) => {
          const collection = collectionMap.get(id);
          return { id, title: collection?.title ?? "Unknown", slug: collection?.slug ?? "", isPublished: collection?.isPublished ?? false };
        }),
      };
    });

  const duplicateSet = new Set(duplicates.map((dup) => dup.artworkId));

  const byCollection = collections.map((collection) => {
    const rows = itemsByCollection.get(collection.id) ?? [];
    let unpublishedArtworks = 0;
    let missingCover = 0;
    let publishBlocked = 0;
    let duplicatesInOtherCollections = 0;

    for (const row of rows) {
      if (!row.artwork.isPublished) unpublishedArtworks += 1;
      const hasCover = Boolean(row.artwork.featuredAssetId) || row.artwork._count.images > 0;
      if (!hasCover) missingCover += 1;
      const completeness = computeArtworkCompleteness(row.artwork, row.artwork._count.images);
      if (!completeness.required.ok) publishBlocked += 1;
      if (duplicateSet.has(row.artworkId)) duplicatesInOtherCollections += 1;
    }

    const flags = [
      unpublishedArtworks > 0 ? "HAS_UNPUBLISHED" : null,
      missingCover > 0 ? "HAS_MISSING_COVER" : null,
      publishBlocked > 0 ? "HAS_PUBLISH_BLOCKED" : null,
      duplicatesInOtherCollections > 0 ? "HAS_DUPES" : null,
    ].filter((value): value is string => Boolean(value));

    const suggestedActions = [
      unpublishedArtworks > 0 ? "Review unpublished artworks before publishing rail." : null,
      missingCover > 0 ? "Add featured image or gallery image to affected artworks." : null,
      publishBlocked > 0 ? "Fix required publish fields (title + image)." : null,
      duplicatesInOtherCollections > 0 ? "Consider replacing duplicate artworks across collections." : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      isPublished: collection.isPublished,
      counts: { totalItems: rows.length, unpublishedArtworks, missingCover, publishBlocked, duplicatesInOtherCollections },
      flags,
      adminEditHref: `/admin/curation?collectionId=${collection.id}`,
      publicHref: collection.isPublished ? `/collections/${collection.slug}` : null,
      suggestedActions,
    };
  });

  return {
    totals: {
      collections: collections.length,
      publishedCollections: collections.filter((collection) => collection.isPublished).length,
      items: items.length,
    },
    byCollection,
    duplicates,
  };
}
