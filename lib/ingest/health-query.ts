import { db } from "@/lib/db";

type IngestDb = Pick<typeof db, "ingestRun">;

export async function getAdminIngestHealthData(dbClient: IngestDb) {
  const now = Date.now();
  const last7DaysStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last24HoursStart = new Date(now - 24 * 60 * 60 * 1000);

  const [last7Runs, last24hRuns, breakerWindowRuns] = await Promise.all([
    dbClient.ingestRun.findMany({
      where: { createdAt: { gte: last7DaysStart } },
      select: {
        status: true,
        errorCode: true,
        createdCandidates: true,
        durationMs: true,
      },
    }),
    dbClient.ingestRun.findMany({
      where: { createdAt: { gte: last24HoursStart } },
      select: {
        id: true,
        createdAt: true,
        venueId: true,
        status: true,
        createdCandidates: true,
        dedupedCandidates: true,
        errorCode: true,
        venue: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    }),
    dbClient.ingestRun.findMany({
      where: { createdAt: { gte: new Date(now - Number.parseInt(process.env.AI_INGEST_CRON_CIRCUIT_BREAKER_WINDOW_HOURS ?? "6", 10) * 60 * 60 * 1000) } },
      select: { status: true },
    }),
  ]);

  const succeeded = last7Runs.filter((run) => run.status === "SUCCEEDED").length;
  const failed = last7Runs.filter((run) => run.status === "FAILED").length;
  const totalRuns = last7Runs.length;
  const successRate = totalRuns > 0 ? succeeded / totalRuns : 0;
  const avgCreatedCandidates = totalRuns > 0
    ? last7Runs.reduce((sum, run) => sum + run.createdCandidates, 0) / totalRuns
    : 0;
  const durationRows = last7Runs.filter((run) => typeof run.durationMs === "number");
  const avgDurationMs = durationRows.length > 0
    ? durationRows.reduce((sum, run) => sum + (run.durationMs ?? 0), 0) / durationRows.length
    : 0;

  const topErrorCodes = Object.entries(
    last7Runs.reduce<Record<string, number>>((acc, run) => {
      if (!run.errorCode) return acc;
      acc[run.errorCode] = (acc[run.errorCode] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([errorCode, count]) => ({ errorCode, count }));

  const cbMinRuns = Number.parseInt(process.env.AI_INGEST_CRON_CIRCUIT_BREAKER_MIN_RUNS ?? "5", 10);
  const cbFailRateThreshold = Number.parseFloat(process.env.AI_INGEST_CRON_CIRCUIT_BREAKER_FAIL_RATE ?? "0.6");
  const cbSucceeded = breakerWindowRuns.filter((run) => run.status === "SUCCEEDED").length;
  const cbFailed = breakerWindowRuns.filter((run) => run.status === "FAILED").length;
  const cbRunCount = cbSucceeded + cbFailed;
  const cbFailRate = cbRunCount > 0 ? cbFailed / cbRunCount : 0;

  return {
    ok: true as const,
    last7Days: {
      totalRuns,
      succeeded,
      failed,
      successRate,
      avgCreatedCandidates,
      avgDurationMs,
      topErrorCodes,
    },
    last24hRuns: last24hRuns.map((run) => ({
      id: run.id,
      createdAt: run.createdAt,
      venueId: run.venueId,
      venueName: run.venue?.name ?? null,
      status: run.status,
      createdCandidates: run.createdCandidates,
      dedupedCandidates: run.dedupedCandidates,
      errorCode: run.errorCode,
    })),
    failures24h: last24hRuns
      .filter((run) => run.status === "FAILED")
      .map((run) => ({ id: run.id, createdAt: run.createdAt, errorCode: run.errorCode })),
    circuitBreaker: {
      open: cbRunCount >= cbMinRuns && cbFailRate >= cbFailRateThreshold,
      failRate: cbFailRate,
      runCount: cbRunCount,
    },
  };
}
