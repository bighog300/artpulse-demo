import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const ct = req.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
    if (!["EVENT", "VENUE", "ARTIST"].includes(body.targetType) || !body.targetId) return apiError(400, "invalid_request", "Invalid favorite payload");
    const item = await db.favorite.upsert({
      where: { userId_targetType_targetId: { userId: user.id, targetType: body.targetType, targetId: body.targetId } },
      update: {},
      create: { userId: user.id, targetType: body.targetType, targetId: body.targetId },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
