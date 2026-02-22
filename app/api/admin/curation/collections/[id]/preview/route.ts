import { NextRequest } from "next/server";
import { handleAdminCurationPreview } from "@/lib/admin-curation-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleAdminCurationPreview(req, await params);
}
