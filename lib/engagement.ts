import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

export const ENGAGEMENT_COOKIE_NAME = "ap_sid";
export const ENGAGEMENT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export function generateSessionId() {
  return randomUUID();
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function sanitizeEngagementMeta(meta: unknown): Prisma.InputJsonValue | undefined {
  const input = asObject(meta);
  if (!input) return undefined;

  const next: Record<string, Prisma.InputJsonValue> = {};

  if (typeof input.digestRunId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.digestRunId)) {
    next.digestRunId = input.digestRunId;
  }

  if (typeof input.position === "number" && Number.isInteger(input.position) && input.position >= 0 && input.position <= 500) {
    next.position = input.position;
  }

  if (typeof input.query === "string") {
    const query = input.query.trim().slice(0, 120);
    if (query.length > 0) next.query = query;
  }

  if (input.feedback === "up" || input.feedback === "down") {
    next.feedback = input.feedback;
  }

  return Object.keys(next).length > 0 ? (next satisfies Prisma.InputJsonObject) : undefined;
}

export function retentionThreshold(days = 90) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export type EngagementDb = {
  engagementEvent: {
    create: (args: Prisma.EngagementEventCreateArgs) => Promise<unknown>;
    count: (args: Prisma.EngagementEventCountArgs) => Promise<number>;
    findMany: (args: Prisma.EngagementEventFindManyArgs) => Promise<Array<{ targetId: string }>>;
  };
  event: {
    findMany: (args: Prisma.EventFindManyArgs) => Promise<Array<{ venueId: string | null; eventTags: Array<{ tag: { slug: string } }>; venue: { id: string; name: string } | null }>>;
  };
};
