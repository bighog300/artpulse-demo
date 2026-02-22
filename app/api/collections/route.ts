import { NextResponse } from "next/server";
import { listPublishedCuratedCollections } from "@/lib/curated-collections";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const collections = await listPublishedCuratedCollections(8);
  return NextResponse.json({ collections }, { headers: { "cache-control": "s-maxage=300, stale-while-revalidate=300" } });
}
