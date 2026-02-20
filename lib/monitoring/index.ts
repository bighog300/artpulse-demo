import * as Sentry from "@sentry/nextjs";
import { logError, logInfo, logWarn } from "@/lib/logging";

type MonitorContext = {
  requestId?: string;
  cronRunId?: string;
  route?: string;
  userScope?: boolean;
  level?: "info" | "warn" | "error";
  [key: string]: unknown;
};
type SpanStatus = "ok" | "error";

export type MonitoringSpan = {
  name: string;
  startedAtMs: number;
  context?: MonitorContext;
  sentrySpan?: { end: () => void; setStatus?: (status: "ok" | "internal_error") => unknown };
};

function hasSentry() {
  return Boolean(process.env.SENTRY_DSN);
}

function baseContext(context: MonitorContext = {}): MonitorContext {
  return {
    requestId: context.requestId,
    cronRunId: context.cronRunId,
    route: context.route,
    userScope: context.userScope,
    ...context,
  };
}

export function captureException(error: unknown, context: MonitorContext = {}) {
  const safeContext = baseContext(context);
  if (hasSentry()) {
    Sentry.withScope((scope) => {
      scope.setContext("monitoring", safeContext);
      Sentry.captureException(error);
    });
    return;
  }

  const err = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  logError({ message: "exception_captured", error: err, ...safeContext });
}

export function captureMessage(message: string, context: MonitorContext = {}) {
  const safeContext = baseContext(context);
  if (hasSentry()) {
    Sentry.withScope((scope) => {
      scope.setContext("monitoring", safeContext);
      Sentry.captureMessage(message);
    });
    return;
  }

  if (safeContext.level === "warn") return logWarn({ message, ...safeContext });
  if (safeContext.level === "error") return logError({ message, ...safeContext });
  return logInfo({ message, ...safeContext });
}

export function startSpan(name: string, context: MonitorContext = {}): MonitoringSpan {
  const span: MonitoringSpan = { name, context: baseContext(context), startedAtMs: Date.now() };

  if (hasSentry()) {
    const sentrySpan = Sentry.startInactiveSpan({ name, op: "task" });
    if (sentrySpan) span.sentrySpan = sentrySpan as unknown as MonitoringSpan["sentrySpan"];
  }

  return span;
}

export function endSpan(span: MonitoringSpan, status: SpanStatus = "ok") {
  const durationMs = Date.now() - span.startedAtMs;
  span.sentrySpan?.setStatus?.(status === "ok" ? "ok" : "internal_error");
  span.sentrySpan?.end();
  captureMessage("span_finished", {
    level: status === "ok" ? "info" : "warn",
    span: span.name,
    durationMs,
    ...span.context,
  });
  return durationMs;
}

export async function withSpan<T>(name: string, fn: () => Promise<T>, context: MonitorContext = {}) {
  const span = startSpan(name, context);
  try {
    const result = await fn();
    endSpan(span, "ok");
    return result;
  } catch (error) {
    captureException(error, { ...context, span: name });
    endSpan(span, "error");
    throw error;
  }
}

export async function flush() {
  if (!hasSentry()) return;
  try {
    await Sentry.flush(500);
  } catch {
    // best effort
  }
}
