import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = { ...body };
    if (body.startAt) data.startAt = new Date(body.startAt);
    if (body.endAt) data.endAt = new Date(body.endAt);
    if (body.isPublished === true && !body.publishedAt) data.publishedAt = new Date();
    const item = await db.event.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    await db.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}
