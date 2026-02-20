import { NextResponse } from "next/server";
import { z } from "zod";
import { trackServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 50 * 1024;
const FORBIDDEN_PROP_KEYS = [/query/i, /lat/i, /lng/i, /email/i, /name/i, /user/i, /address/i];

const analyticsSchema = z.object({
  name: z.string().min(1).max(80),
  props: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean()])).optional(),
  ts: z.string().datetime(),
  path: z.string().max(250),
  sid: z.string().uuid().optional(),
  referrer: z.string().max(250).optional(),
}).strict();

function hasForbiddenProps(props?: Record<string, string | number | boolean>) {
  if (!props) return false;
  return Object.keys(props).some((key) => FORBIDDEN_PROP_KEYS.some((pattern) => pattern.test(key)));
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const json = await req.json().catch(() => null);
  const parsed = analyticsSchema.safeParse(json);
  if (!parsed.success || hasForbiddenProps(parsed.data.props)) {
    return new NextResponse(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  trackServerEvent(parsed.data);
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
