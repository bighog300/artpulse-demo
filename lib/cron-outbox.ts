import { captureException, trackMetric } from "@/lib/telemetry";
import { validateCronRequest } from "@/lib/cron-auth";
export type SendPendingNotifications = ({ limit }: { limit: number }) => Promise<{
  sent: number;
  failed: number;
  skipped: number;
}>;

export async function runCronOutboxSend(
  headerSecret: string | null,
  sendPendingNotifications: SendPendingNotifications,
  meta: { requestId?: string; method?: string } = {},
): Promise<Response> {
  const authFailureResponse = validateCronRequest(headerSecret, { route: "/api/cron/outbox/send", ...meta });
  if (authFailureResponse) return authFailureResponse;

  try {
    const result = await sendPendingNotifications({ limit: 25 });
    trackMetric("cron.outbox.sent", result.sent, { failed: result.failed, skipped: result.skipped });
    return Response.json(result);
  } catch (error) {
    captureException(error, { route: "/api/cron/outbox/send" });
    return Response.json({ error: { code: "internal_error", message: "Cron execution failed", details: undefined } }, { status: 500 });
  }
}
