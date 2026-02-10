import NextAuth from "next-auth";
import { assertAuthConfig, authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export async function GET(req: Request, ctx: unknown) {
  assertAuthConfig();
  return handler(req, ctx as never);
}

export async function POST(req: Request, ctx: unknown) {
  assertAuthConfig();
  return handler(req, ctx as never);
}
