import { trackMetric } from "@/lib/telemetry";
import { validateCronRequest } from "@/lib/cron-auth";
import { createCronRunId, logCronSummary, shouldDryRun, tryAcquireCronLock } from "@/lib/cron-runtime";
import { captureException, withSpan } from "@/lib/monitoring";
import { sendAlert } from "@/lib/alerts";
import { markCronFailure, markCronSuccess } from "@/lib/ops-metrics";

const OUTBOX_LIMIT = 25;
const OUTBOX_MAX_DURATION_MS = 20_000;

export type SendPendingNotifications = ({ limit }: { limit: number }) => Promise<{
  sent: number;
  failed: number;
  skipped: number;
}>;

export async function runCronOutboxSend(
  headerSecret: string | null,
  sendPendingNotifications: SendPendingNotifications,
  meta: { requestId?: string; method?: string; dryRun?: string | null; lockStore?: unknown } = {},
): Promise<Response> {
  const route = "/api/cron/outbox/send";
  const authFailureResponse = validateCronRequest(headerSecret, { route, ...meta });
  if (authFailureResponse) return authFailureResponse;

  const startedAt = new Date();
  const dryRun = shouldDryRun(meta.dryRun);
  const cronRunId = createCronRunId();
  const lock = await tryAcquireCronLock(meta.lockStore, "cron:outbox:send");
  if (!lock.acquired) {
    return Response.json({ ok: true, cronName: "outbox_send", cronRunId, dryRun, skipped: "lock_not_acquired" }, { status: 202 });
  }

  try {
    return await withSpan(`cron:outbox_send`, async () => {
      if (Date.now() - startedAt.getTime() > OUTBOX_MAX_DURATION_MS) {
        return Response.json({ ok: true, cronName: "outbox_send", cronRunId, dryRun, processedCount: 0, errorCount: 0, sent: 0, failed: 0, skipped: 0, timedOut: true });
      }

      const result = dryRun ? { sent: 0, failed: 0, skipped: 0 } : await sendPendingNotifications({ limit: OUTBOX_LIMIT });
      trackMetric("cron.outbox.sent", result.sent, { failed: result.failed, skipped: result.skipped, dryRun });

      const summary = {
        ok: true,
        cronName: "outbox_send",
        cronRunId,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt.getTime(),
        processedCount: result.sent + result.failed + result.skipped,
        errorCount: result.failed,
        dryRun,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        limit: OUTBOX_LIMIT,
        lock: lock.supported ? "acquired" : "unsupported",
      } as const;

      logCronSummary(summary);
      if (summary.errorCount > 0) {
        markCronFailure(summary.cronName, `failed=${summary.failed}`);
        await sendAlert({
          severity: "error",
          title: "Cron outbox failures",
          body: `cron=${summary.cronName} cronRunId=${summary.cronRunId} durationMs=${summary.durationMs} failed=${summary.failed}`,
          tags: { cronName: summary.cronName, cronRunId: summary.cronRunId, durationMs: summary.durationMs, errorCount: summary.errorCount },
        });
      } else {
        markCronSuccess(summary.cronName, summary.finishedAt);
      }
      return Response.json(summary);
    }, { route, requestId: meta.requestId, cronRunId, userScope: false });
  } catch (error) {
    captureException(error, { route, requestId: meta.requestId, cronRunId, userScope: false });
    const summary = {
      ok: false,
      cronName: "outbox_send",
      cronRunId,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      processedCount: 0,
      errorCount: 1,
      dryRun,
      lock: lock.supported ? "acquired" : "unsupported",
    } as const;
    markCronFailure(summary.cronName, "internal_error");
    await sendAlert({
      severity: "error",
      title: "Cron execution failed",
      body: `cron=${summary.cronName} cronRunId=${summary.cronRunId} durationMs=${summary.durationMs}`,
      tags: { cronName: summary.cronName, cronRunId: summary.cronRunId, durationMs: summary.durationMs },
    });
    logCronSummary(summary);
    return Response.json({ ...summary, error: { code: "internal_error", message: "Cron execution failed", details: undefined } }, { status: 500 });
  } finally {
    await lock.release();
  }
}
