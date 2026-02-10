import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth/signin/google?callbackUrl=/account", req.url));
}
