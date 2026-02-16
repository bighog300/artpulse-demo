import { engagementRetentionQuerySchema } from "@/lib/validators";
import { validateCronRequest } from "@/lib/cron-auth";

export type EngagementRetentionDb = {
  engagementEvent: {
    count: (args: { where: { createdAt: { lt: Date } } }) => Promise<number>;
    deleteMany: (args: { where: { createdAt: { lt: Date } } }) => Promise<{ count: number }>;
  };
};

export async function runEngagementRetentionCron(
  headerSecret: string | null,
  rawQuery: Record<string, string>,
  retentionDb: EngagementRetentionDb,
  meta: { requestId?: string; method?: string } = {},
) {
  const authFailureResponse = validateCronRequest(headerSecret, { route: "/api/cron/retention/engagement", ...meta });
  if (authFailureResponse) return authFailureResponse;

  const parsedQuery = engagementRetentionQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return Response.json({ error: { code: "invalid_request", message: "Invalid query params", details: parsedQuery.error.flatten() } }, { status: 400 });
  }

  const { keepDays, dryRun } = parsedQuery.data;
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

  if (dryRun) {
    const wouldDelete = await retentionDb.engagementEvent.count({ where: { createdAt: { lt: cutoff } } });
    return Response.json({ dryRun: true, cutoff: cutoff.toISOString(), wouldDelete });
  }

  const deleted = await retentionDb.engagementEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return Response.json({ dryRun: false, cutoff: cutoff.toISOString(), deleted: deleted.count });
}
