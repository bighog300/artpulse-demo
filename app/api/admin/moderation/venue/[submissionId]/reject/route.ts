import { createAdminModerationDeps } from "@/lib/admin-moderation-db";
import { handleAdminModerationReject } from "@/lib/admin-moderation-route";

export async function POST(req: Request, context: { params: Promise<{ submissionId: string }> }) {
  return handleAdminModerationReject(req as never, "VENUE", await context.params, createAdminModerationDeps());
}
