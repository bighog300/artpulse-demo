import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    await db.favorite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
