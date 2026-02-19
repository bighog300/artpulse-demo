import { NextRequest } from "next/server";
import { handleForYouGet } from "@/lib/api-recommendations-for-you";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleForYouGet(req);
}
