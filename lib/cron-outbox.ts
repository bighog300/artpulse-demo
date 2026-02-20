import { captureException, trackMetric } from "@/lib/telemetry";
import { validateCronRequest } from "@/lib/cron-auth";
import { logCronSummary, shouldDryRun, tryAcquireCronLock } from "@/lib/cron-runtime";

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
  const authFailureResponse = validateCronRequest(headerSecret, { route: "/api/cron/outbox/send", ...meta });
  if (authFailureResponse) return authFailureResponse;

  const startedAt = new Date();
  const dryRun = shouldDryRun(meta.dryRun);
  const lock = await tryAcquireCronLock(meta.lockStore, "cron:outbox:send");
  if (!lock.acquired) {
    return Response.json({ ok: true, cronName: "outbox_send", dryRun, skipped: "lock_not_acquired" }, { status: 202 });
  }

  try {
    if (Date.now() - startedAt.getTime() > OUTBOX_MAX_DURATION_MS) {
      return Response.json({ ok: true, cronName: "outbox_send", dryRun, processedCount: 0, errorCount: 0, sent: 0, failed: 0, skipped: 0, timedOut: true });
    }

    const result = dryRun ? { sent: 0, failed: 0, skipped: 0 } : await sendPendingNotifications({ limit: OUTBOX_LIMIT });
    trackMetric("cron.outbox.sent", result.sent, { failed: result.failed, skipped: result.skipped, dryRun });

    const summary = {
      ok: true,
      cronName: "outbox_send",
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
    return Response.json(summary);
  } catch (error) {
    captureException(error, { route: "/api/cron/outbox/send" });
    const summary = {
      ok: false,
      cronName: "outbox_send",
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      processedCount: 0,
      errorCount: 1,
      dryRun,
      lock: lock.supported ? "acquired" : "unsupported",
    } as const;
    logCronSummary(summary);
    return Response.json({ ...summary, error: { code: "internal_error", message: "Cron execution failed", details: undefined } }, { status: 500 });
  } finally {
    await lock.release();
  }
}
