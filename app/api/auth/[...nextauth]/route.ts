import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: { code: "not_implemented", message: "NextAuth package unavailable in this environment." } }, { status: 501 });
}

export async function POST() {
  return GET();
}
