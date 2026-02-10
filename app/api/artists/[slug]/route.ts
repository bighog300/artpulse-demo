import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await db.artist.findFirst({ where: { slug, isPublished: true }, include: { eventArtists: { include: { event: true } } } });
  if (!artist) return apiError(404, "not_found", "Artist not found");
  return NextResponse.json(artist);
}
