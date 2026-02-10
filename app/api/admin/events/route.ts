import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireEditor } from "@/lib/auth";
import { isSlug } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireEditor();
    const ct = req.headers.get("content-type") || "";
    const body = (ct.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries())) as Record<string, string>;
    const isPublished = body.isPublished === "on" || body.isPublished === "true";
    if (!body.title || !isSlug(body.slug || "") || !body.startAt || !body.timezone) return apiError(400, "invalid_request", "Invalid payload");
    const item = await db.event.create({ data: { ...body, startAt: new Date(body.startAt), endAt: body.endAt ? new Date(body.endAt) : null, isPublished, publishedAt: isPublished ? new Date() : null } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return apiError(403, "forbidden", "Editor role required");
  }
}
