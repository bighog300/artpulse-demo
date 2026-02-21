import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { myArtworkCreateSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAuth();
  const artist = await db.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!artist && user.role !== "ADMIN") return apiError(403, "forbidden", "Artist profile required");

  const items = await db.artwork.findMany({
    where: user.role === "ADMIN" ? {} : { artistId: artist!.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, isPublished: true, updatedAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const artist = await db.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!artist) return apiError(403, "forbidden", "Artist profile required");

    const parsedBody = myArtworkCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const artwork = await db.artwork.create({ data: { ...parsedBody.data, artistId: artist.id, isPublished: false } });
    await logAdminAction({ actorEmail: user.email, action: "ARTWORK_CREATED", targetType: "artwork", targetId: artwork.id, metadata: { artworkId: artwork.id, artistId: artist.id }, req });
    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
