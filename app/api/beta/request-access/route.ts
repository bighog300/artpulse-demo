import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { handleRequestAccess } from "@/lib/beta/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser().catch(() => null);
  return handleRequestAccess(req, user?.id);
}
