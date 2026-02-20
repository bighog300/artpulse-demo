import { engagementRetentionQuerySchema } from "@/lib/validators";
import { validateCronRequest } from "@/lib/cron-auth";
import { logCronSummary, shouldDryRun, tryAcquireCronLock } from "@/lib/cron-runtime";

const RETENTION_MAX_DURATION_MS = 15_000;

export type EngagementRetentionDb = {
  engagementEvent: {
    count: (args: { where: { createdAt: { lt: Date } } }) => Promise<number>;
    deleteMany: (args: { where: { createdAt: { lt: Date } } }) => Promise<{ count: number }>;
  };
  $queryRaw?: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

export async function runEngagementRetentionCron(
  headerSecret: string | null,
  rawQuery: Record<string, string>,
  retentionDb: EngagementRetentionDb,
  meta: { requestId?: string; method?: string } = {},
) {
  const authFailureResponse = validateCronRequest(headerSecret, { route: "/api/cron/retention/engagement", ...meta });
  if (authFailureResponse) return authFailureResponse;

  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();
  const normalizedQuery = { ...rawQuery };
  if (shouldDryRun(rawQuery.dryRun)) normalizedQuery.dryRun = "true";

  const parsedQuery = engagementRetentionQuerySchema.safeParse(normalizedQuery);
  if (!parsedQuery.success) {
    return Response.json({ error: { code: "invalid_request", message: "Invalid query params", details: parsedQuery.error.flatten() } }, { status: 400 });
  }

  const lock = await tryAcquireCronLock(retentionDb, "cron:retention:engagement");
  if (!lock.acquired) {
    return Response.json({ ok: true, cronName: "retention_engagement", dryRun: parsedQuery.data.dryRun, skipped: "lock_not_acquired" }, { status: 202 });
  }

  const { keepDays, dryRun } = parsedQuery.data;
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

  try {
    if (Date.now() - startedAtMs > RETENTION_MAX_DURATION_MS) {
      return Response.json({ ok: true, cronName: "retention_engagement", dryRun, timedOut: true, processedCount: 0, errorCount: 0 });
    }

    if (dryRun) {
      const wouldDelete = await retentionDb.engagementEvent.count({ where: { createdAt: { lt: cutoff } } });
      const summary = {
        ok: true,
        cronName: "retention_engagement",
        startedAt: startedAtIso,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAtMs,
        processedCount: wouldDelete,
        errorCount: 0,
        dryRun: true,
        cutoff: cutoff.toISOString(),
        wouldDelete,
        lock: lock.supported ? "acquired" : "unsupported",
      } as const;
      logCronSummary(summary);
      return Response.json(summary);
    }

    const deleted = await retentionDb.engagementEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const summary = {
      ok: true,
      cronName: "retention_engagement",
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAtMs,
      processedCount: deleted.count,
      errorCount: 0,
      dryRun: false,
      cutoff: cutoff.toISOString(),
      deleted: deleted.count,
      lock: lock.supported ? "acquired" : "unsupported",
    } as const;
    logCronSummary(summary);
    return Response.json(summary);
  } finally {
    await lock.release();
  }
}
