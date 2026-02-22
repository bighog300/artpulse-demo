import { createAdminModerationDeps } from "@/lib/admin-moderation-db";
import { handleAdminModerationQueue } from "@/lib/admin-moderation-route";

export async function GET(req: Request) {
  return handleAdminModerationQueue(req as never, createAdminModerationDeps());
}
