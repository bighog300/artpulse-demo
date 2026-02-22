import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { CollectionSortMode, getPublishedCuratedCollectionBySlug } from "@/lib/curated-collections";
import { collectionPageQuerySchema, paramsToObject, slugParamSchema, zodDetails } from "@/lib/validators";

type Deps = {
  getCollection: typeof getPublishedCuratedCollectionBySlug;
};

const defaultDeps: Deps = { getCollection: getPublishedCuratedCollectionBySlug };
const allowedSorts = new Set<CollectionSortMode>(["CURATED", "VIEWS_30D_DESC", "NEWEST"]);

export async function handlePublicCollectionBySlug(req: NextRequest, params: { slug: string }, deps: Deps = defaultDeps) {
  const parsed = slugParamSchema.safeParse(params);
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid slug", zodDetails(parsed.error));

  const queryParsed = collectionPageQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!queryParsed.success) return apiError(400, "invalid_request", "Invalid query", zodDetails(queryParsed.error));
  const sort = queryParsed.data.sort;
  if (sort && !allowedSorts.has(sort)) return apiError(400, "invalid_request", "Invalid sort mode");

  const collection = await deps.getCollection(parsed.data.slug, {
    sort: sort ?? "CURATED",
    page: queryParsed.data.page,
    pageSize: queryParsed.data.pageSize,
  });
  if (!collection) return apiError(404, "not_found", "Collection not found");

  return NextResponse.json({ collection }, { headers: { "cache-control": "s-maxage=300, stale-while-revalidate=300" } });
}
