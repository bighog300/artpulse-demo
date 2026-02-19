import { logInfo, logWarn } from "@/lib/logging";

export function validateCronRequest(headerSecret: string | null, meta: { route: string; requestId?: string; method?: string }) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    logWarn({ message: "cron_secret_missing", route: meta.route, requestId: meta.requestId, method: meta.method });
    return Response.json({ error: { code: "misconfigured", message: "CRON_SECRET is not configured", details: undefined } }, { status: 500 });
  }

  if (headerSecret !== configuredSecret) {
    logWarn({ message: "cron_unauthorized", route: meta.route, requestId: meta.requestId, method: meta.method });
    return Response.json({ error: { code: "unauthorized", message: "Unauthorized", details: undefined } }, { status: 401 });
  }

  logInfo({ message: "cron_authorized", route: meta.route, requestId: meta.requestId, method: meta.method });
  return null;
}


export function extractCronSecret(headers: Headers) {
  const authorization = headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return headers.get("x-cron-secret");
}
