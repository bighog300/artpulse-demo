import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleLatestEventRevision } from "@/lib/my-venue-event-revision-route";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  return handleLatestEventRevision((async () => { const p = await params; return { venueId: p.id, eventId: p.eventId }; })(), {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
    findEvent: async () => null,
    createRevisionSubmission: async () => { throw new Error("not used"); },
    getLatestRevision: async (eventId) => db.submission.findFirst({
      where: { type: "EVENT", kind: "REVISION", targetEventId: eventId },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, createdAt: true, decisionReason: true, decidedAt: true },
    }),
  });
}
