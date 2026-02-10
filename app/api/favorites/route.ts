import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { favoriteBodySchema, parseBody, zodDetails } from "@/lib/validators";

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
    const parsed = favoriteBodySchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid favorite payload", zodDetails(parsed.error));

    const item = await db.favorite.upsert({
      where: { userId_targetType_targetId: { userId: user.id, targetType: parsed.data.targetType, targetId: parsed.data.targetId } },
      update: {},
      create: { userId: user.id, targetType: parsed.data.targetType, targetId: parsed.data.targetId },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
