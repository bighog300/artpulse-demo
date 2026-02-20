import { captureException as captureMonitoringException, captureMessage } from "@/lib/monitoring";

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  captureMonitoringException(error, context);
}

export function trackMetric(name: string, value: number, tags: Record<string, string | number | boolean> = {}) {
  captureMessage("metric", { metric: { name, value, tags } });
}
