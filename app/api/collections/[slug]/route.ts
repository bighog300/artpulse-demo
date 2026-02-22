import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getPublishedCuratedCollectionBySlug } from "@/lib/curated-collections";
import { slugParamSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugParamSchema.safeParse(await params);
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid slug", zodDetails(parsed.error));
  const collection = await getPublishedCuratedCollectionBySlug(parsed.data.slug);
  if (!collection) return apiError(404, "not_found", "Collection not found");
  return NextResponse.json({ collection });
}
