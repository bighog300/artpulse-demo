import { logError, logInfo } from "@/lib/logging";

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  logError({
    message: "exception_captured",
    error: err,
    ...context,
  });
}

export function trackMetric(name: string, value: number, tags: Record<string, string | number | boolean> = {}) {
  logInfo({
    message: "metric",
    metric: { name, value, tags },
  });
}
