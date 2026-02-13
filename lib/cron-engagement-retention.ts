import { engagementRetentionQuerySchema } from "@/lib/validators";

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
) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return Response.json({ error: { code: "misconfigured", message: "CRON_SECRET is not configured", details: undefined } }, { status: 500 });
  }

  if (headerSecret !== configuredSecret) {
    return Response.json({ error: { code: "unauthorized", message: "Invalid cron secret", details: undefined } }, { status: 401 });
  }

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
