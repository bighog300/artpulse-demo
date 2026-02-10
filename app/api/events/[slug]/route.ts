import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, isPublished: true }, include: { venue: true, images: true, eventTags: { include: { tag: true } }, eventArtists: { include: { artist: true } } } });
  if (!event) return apiError(404, "not_found", "Event not found");
  return NextResponse.json(event);
}
