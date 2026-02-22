import { NextRequest } from "next/server";
import { handleAdminCurationQa } from "@/lib/admin-curation-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handleAdminCurationQa(req);
}
