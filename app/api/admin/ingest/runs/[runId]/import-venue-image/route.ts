import { withAdminRoute } from "@/lib/admin-route";
import { handleIngestImportVenueImage } from "@/lib/admin-ingest-import-venue-image-route";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  return withAdminRoute(async ({ actorEmail }) => handleIngestImportVenueImage(req, await params, actorEmail));
}
