import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, include: { events: { where: { isPublished: true }, orderBy: { startAt: "asc" } } } });
  if (!venue) return apiError(404, "not_found", "Venue not found");
  return NextResponse.json(venue);
}
