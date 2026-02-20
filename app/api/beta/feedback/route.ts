import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { handleFeedback } from "@/lib/beta/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser().catch(() => null);
  return handleFeedback(req, user?.id);
}
