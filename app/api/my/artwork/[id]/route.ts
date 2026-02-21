import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { logAdminAction } from "@/lib/admin-audit";
import { requireMyArtworkAccess } from "@/lib/my-artwork-access";
import { idParamSchema, myArtworkPatchSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = idParamSchema.safeParse(await params);
  if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

  try {
    await requireMyArtworkAccess(parsedId.data.id);
    const artwork = await db.artwork.findUnique({ where: { id: parsedId.data.id }, include: { images: { include: { asset: true }, orderBy: { sortOrder: "asc" } }, venues: true, events: true } });
    if (!artwork) return apiError(404, "not_found", "Artwork not found");
    return NextResponse.json({ artwork });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && (error.message === "forbidden" || error.message === "not_found")) return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = idParamSchema.safeParse(await params);
  if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

  try {
    const { user } = await requireMyArtworkAccess(parsedId.data.id);
    const parsedBody = myArtworkPatchSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const before = await db.artwork.findUnique({ where: { id: parsedId.data.id } });
    const artwork = await db.artwork.update({ where: { id: parsedId.data.id }, data: parsedBody.data });
    await logAdminAction({ actorEmail: user.email, action: "ARTWORK_UPDATED", targetType: "artwork", targetId: artwork.id, metadata: { before, after: parsedBody.data }, req });
    return NextResponse.json({ artwork });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && (error.message === "forbidden" || error.message === "not_found")) return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
