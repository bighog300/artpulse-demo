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

  const result = await sendPendingNotifications({ limit: 25 });
  return Response.json(result);
}
