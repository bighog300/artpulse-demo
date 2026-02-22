import { NextRequest } from "next/server";
import { handlePublicCollectionBySlug } from "@/lib/public-collections-route";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return handlePublicCollectionBySlug(req, await params);
}
