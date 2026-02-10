import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";

export const runtime = "nodejs";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const item = await db.venue.update({ where: { id }, data: await req.json() });
    return NextResponse.json(item);
  } catch { return apiError(403, "forbidden", "Editor role required"); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireEditor(); const { id } = await params; await db.venue.delete({ where: { id } }); return NextResponse.json({ ok: true }); } catch { return apiError(403, "forbidden", "Editor role required"); }
}
