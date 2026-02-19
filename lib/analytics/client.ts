"use client";

import type { AnalyticsEventName, AnalyticsPayload, AnalyticsProps, AnalyticsProvider } from "@/lib/analytics/types";

const SESSION_KEY = "ap_sid";
const MAX_KEYS = 20;
const MAX_STRING_LENGTH = 120;

class ConsoleProvider implements AnalyticsProvider {
  send(event: AnalyticsPayload) {
    console.debug("[analytics]", event.name, event.props ?? {});
  }
}

class HttpProvider implements AnalyticsProvider {
  constructor(private readonly endpoint: string) {}

  async send(event: AnalyticsPayload) {
    await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  }
}

function createProvider(): AnalyticsProvider | null {
  if (process.env.NODE_ENV !== "production") return new ConsoleProvider();
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (endpoint) return new HttpProvider(endpoint);
  return null;
}

const provider = createProvider();

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const entries = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, MAX_KEYS)
    .map(([key, value]) => {
      if (typeof value === "string") return [key, value.slice(0, MAX_STRING_LENGTH)] as const;
      return [key, value] as const;
    });
  return entries.length ? Object.fromEntries(entries) as AnalyticsProps : undefined;
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function buildPayload(name: AnalyticsEventName, props?: AnalyticsProps): AnalyticsPayload | null {
  if (typeof window === "undefined") return null;
  return {
    name,
    props: sanitizeProps(props),
    ts: new Date().toISOString(),
    path: window.location.pathname,
    referrer: document.referrer ? document.referrer.slice(0, MAX_STRING_LENGTH) : undefined,
    sid: getSessionId(),
  };
}

export type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/types";

export function track(name: AnalyticsEventName, props?: AnalyticsProps) {
  if (!provider) return;
  const payload = buildPayload(name, props);
  if (!payload) return;
  try {
    void provider.send(payload);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics] send_failed", name);
    }
  }
}

export function pageview(props?: AnalyticsProps) {
  track("events_list_viewed", props);
}
