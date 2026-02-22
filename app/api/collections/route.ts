import { NextResponse } from "next/server";
import { listPublishedCuratedCollections } from "@/lib/curated-collections";

export const runtime = "nodejs";

export async function GET() {
  const collections = await listPublishedCuratedCollections(8);
  return NextResponse.json({ collections });
}
