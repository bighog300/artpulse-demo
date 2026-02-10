import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  await createSession(email);
  return NextResponse.redirect(new URL("/account", req.url));
}
