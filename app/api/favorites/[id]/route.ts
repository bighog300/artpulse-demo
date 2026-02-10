import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { idParamSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const parsed = idParamSchema.safeParse(await params);
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsed.error));

    await db.favorite.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
