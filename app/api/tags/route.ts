import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const items = await db.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ items });
}
