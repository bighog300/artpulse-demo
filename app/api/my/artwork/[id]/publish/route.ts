import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { logAdminAction } from "@/lib/admin-audit";
import { requireMyArtworkAccess } from "@/lib/my-artwork-access";
import { artworkPublishPatchSchema, idParamSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = idParamSchema.safeParse(await params);
  if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
  const parsedBody = artworkPublishPatchSchema.safeParse(await parseBody(req));
  if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

  try {
    const { user } = await requireMyArtworkAccess(parsedId.data.id);
    const artwork = await db.artwork.update({ where: { id: parsedId.data.id }, data: { isPublished: parsedBody.data.isPublished } });
    await logAdminAction({ actorEmail: user.email, action: "ARTWORK_PUBLISH_TOGGLED", targetType: "artwork", targetId: artwork.id, metadata: { isPublished: artwork.isPublished }, req });
    return NextResponse.json({ artwork });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && (error.message === "forbidden" || error.message === "not_found")) return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
