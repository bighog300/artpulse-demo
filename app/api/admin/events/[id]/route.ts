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

    const data: Record<string, unknown> = { ...parsedBody.data };
    if (parsedBody.data.startAt) data.startAt = new Date(parsedBody.data.startAt);
    if (parsedBody.data.endAt) data.endAt = new Date(parsedBody.data.endAt);
    if (parsedBody.data.isPublished === true && !data.publishedAt) data.publishedAt = new Date();

    const item = await db.event.update({ where: { id: parsedId.data.id }, data });
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
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}
