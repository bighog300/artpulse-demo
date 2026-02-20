import { db } from "@/lib/db";
import { sendAlert } from "@/lib/alerts";

export type CronRuntimeState = {
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorSummary?: string;
};

const cronState: Record<string, CronRuntimeState> = {};
const CRON_STALL_THRESHOLD_MS = 36 * 60 * 60 * 1000;
const OUTBOX_BACKLOG_WARN_THRESHOLD = 200;

export function markCronSuccess(cronName: string, timestampIso = new Date().toISOString()) {
  const current = cronState[cronName] ?? {};
  cronState[cronName] = { ...current, lastSuccessAt: timestampIso };
}

export function markCronFailure(cronName: string, summary: string, timestampIso = new Date().toISOString()) {
  const current = cronState[cronName] ?? {};
  cronState[cronName] = { ...current, lastErrorAt: timestampIso, lastErrorSummary: summary };
}

async function safeOutboxPendingCount() {
  if (!process.env.DATABASE_URL) return "unknown" as const;
  try {
    return await db.notificationOutbox.count({ where: { status: "PENDING", errorMessage: null } });
  } catch {
    return "unknown" as const;
  }
}

export async function getCronStatusSnapshot() {
  return {
    outbox_send: cronState.outbox_send ?? {},
    digests_weekly: cronState.digests_weekly ?? {},
    retention_engagement: cronState.retention_engagement ?? {},
  };
}

export async function runOpsWatchdog() {
  const cron = await getCronStatusSnapshot();
  const nowMs = Date.now();

  for (const [cronName, state] of Object.entries(cron)) {
    if (!state.lastSuccessAt) continue;
    const ageMs = nowMs - new Date(state.lastSuccessAt).getTime();
    if (ageMs > CRON_STALL_THRESHOLD_MS) {
      await sendAlert({
        severity: "error",
        title: "Cron stalled",
        body: `${cronName} has not completed successfully in ${Math.floor(ageMs / 3_600_000)}h`,
        tags: { cronName, ageMs, thresholdMs: CRON_STALL_THRESHOLD_MS },
      });
    }
  }

  const backlog = await safeOutboxPendingCount();
  if (typeof backlog === "number" && backlog > OUTBOX_BACKLOG_WARN_THRESHOLD) {
    await sendAlert({
      severity: "warn",
      title: "Outbox backlog high",
      body: `Pending outbox notifications: ${backlog}`,
      tags: { backlog, threshold: OUTBOX_BACKLOG_WARN_THRESHOLD },
    });
  }

  return { cron, backlog, stallThresholdHours: CRON_STALL_THRESHOLD_MS / 3_600_000 };
}

export async function getOpsMetricsSnapshot() {
  return {
    build: {
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_SHA ?? "unknown",
      buildTimeISO: process.env.VERCEL_GIT_COMMIT_TIMESTAMP ?? process.env.BUILD_TIME_ISO ?? "unknown",
    },
    cron: await getCronStatusSnapshot(),
    outbox: {
      pendingCount: await safeOutboxPendingCount(),
      backlogWarnThreshold: OUTBOX_BACKLOG_WARN_THRESHOLD,
    },
    personalization: {
      version: process.env.NEXT_PUBLIC_PERSONALIZATION_VERSION === "v2" ? "v2" : "v3",
      exposureSampleRateProd: 0.1,
    },
  };
}
