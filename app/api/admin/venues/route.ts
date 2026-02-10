import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";
import { isSlug } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireEditor();
    const body = await req.json();
    if (!body.name || !isSlug(body.slug)) return apiError(400, "invalid_request", "Invalid payload");
    const item = await db.venue.create({ data: body });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}
