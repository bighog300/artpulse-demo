import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth/signout?callbackUrl=/", req.url));
}
