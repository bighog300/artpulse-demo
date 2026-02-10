import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";
import { adminEventCreateSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireEditor();
    const parsed = adminEventCreateSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));
    const { startAt, endAt, isPublished, tagSlugs = [], artistSlugs = [], images = [], ...rest } = parsed.data;

    const item = await db.event.create({
      data: {
        ...rest,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null,
        eventTags: tagSlugs.length ? { create: tagSlugs.map((slug) => ({ tag: { connect: { slug } } })) } : undefined,
        eventArtists: artistSlugs.length ? { create: artistSlugs.map((slug) => ({ artist: { connect: { slug } } })) } : undefined,
        images: images.length ? { create: images } : undefined,
      },
      include: { eventTags: { include: { tag: true } }, eventArtists: { include: { artist: true } }, images: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}
