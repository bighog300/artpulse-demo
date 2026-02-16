import { captureException, trackMetric } from "@/lib/telemetry";
export type SendPendingNotifications = ({ limit }: { limit: number }) => Promise<{
  sent: number;
  failed: number;
  skipped: number;
}>;

export async function runCronOutboxSend(
  headerSecret: string | null,
  sendPendingNotifications: SendPendingNotifications,
): Promise<Response> {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return Response.json({ error: { code: "misconfigured", message: "CRON_SECRET is not configured", details: undefined } }, { status: 500 });
  }

  if (headerSecret !== configuredSecret) {
    return Response.json({ error: { code: "unauthorized", message: "Invalid cron secret", details: undefined } }, { status: 401 });
  }

  try {
    const result = await sendPendingNotifications({ limit: 25 });
    trackMetric("cron.outbox.sent", result.sent, { failed: result.failed, skipped: result.skipped });
    return Response.json(result);
  } catch (error) {
    captureException(error, { route: "/api/cron/outbox/send" });
    return Response.json({ error: { code: "internal_error", message: "Cron execution failed", details: undefined } }, { status: 500 });
  }
}
