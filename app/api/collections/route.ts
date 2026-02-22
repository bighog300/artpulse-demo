import { NextResponse } from "next/server";
import { listPublishedCuratedCollections } from "@/lib/curated-collections";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const surface = searchParams.get("surface") === "artwork" ? "artwork" : "home";
  const collections = await listPublishedCuratedCollections(8, surface);
  return NextResponse.json({ collections }, { headers: { "cache-control": "s-maxage=300, stale-while-revalidate=300" } });
}
