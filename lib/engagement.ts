import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

export const ENGAGEMENT_COOKIE_NAME = "ap_sid";
export const ENGAGEMENT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export function generateSessionId() {
  return randomUUID();
}

export function sanitizeEngagementMeta(meta: { digestRunId?: string; position?: number; query?: string } | undefined) {
  if (!meta) return undefined;
  const next: { digestRunId?: string; position?: number; query?: string } = {};
  if (meta.digestRunId) next.digestRunId = meta.digestRunId;
  if (typeof meta.position === "number") next.position = meta.position;
  if (meta.query) next.query = meta.query.slice(0, 120);
  return Object.keys(next).length ? next : undefined;
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
