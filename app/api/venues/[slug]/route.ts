import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { slugParamSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugParamSchema.safeParse(await params);
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsed.error));
  const venue = await db.venue.findFirst({ where: { slug: parsed.data.slug, isPublished: true }, include: { events: { where: { isPublished: true }, orderBy: { startAt: "asc" } } } });
  if (!venue) return apiError(404, "not_found", "Venue not found");
  return NextResponse.json(venue);
}
