import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";
import { adminEventPatchSchema, idParamSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    const parsedBody = adminEventPatchSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const existing = await db.event.findUnique({ where: { id: parsedId.data.id }, select: { isPublished: true, publishedAt: true } });
    if (!existing) return apiError(404, "not_found", "Event not found");

    const { tagSlugs, artistSlugs, images, ...body } = parsedBody.data;
    const data: Record<string, unknown> = { ...body };
    if (parsedBody.data.startAt) data.startAt = new Date(parsedBody.data.startAt);
    if (parsedBody.data.endAt) data.endAt = parsedBody.data.endAt ? new Date(parsedBody.data.endAt) : null;

    if (parsedBody.data.isPublished === true && existing.isPublished === false) {
      data.publishedAt = new Date();
    }

    const item = await db.event.update({
      where: { id: parsedId.data.id },
      data: {
        ...data,
        ...(tagSlugs ? { eventTags: { deleteMany: {}, create: tagSlugs.map((slug) => ({ tag: { connect: { slug } } })) } } : {}),
        ...(artistSlugs ? { eventArtists: { deleteMany: {}, create: artistSlugs.map((slug) => ({ artist: { connect: { slug } } })) } } : {}),
        ...(images ? { images: { deleteMany: {}, create: images } } : {}),
      },
      include: { eventTags: { include: { tag: true } }, eventArtists: { include: { artist: true } }, images: true },
    });
    return NextResponse.json(item);
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    await db.event.delete({ where: { id: parsedId.data.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Editor role required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
