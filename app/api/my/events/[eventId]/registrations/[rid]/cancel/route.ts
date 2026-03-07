import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { enqueueNotification } from "@/lib/notifications";
import { handlePostMyEventRegistrationCancel } from "@/lib/registration-list-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string; rid: string }> }) {
  const { eventId, rid } = await params;
  return handlePostMyEventRegistrationCancel(req, eventId, rid, {
    requireAuth,
    hasEventVenueMembership: async (targetEventId, userId) => {
      const count = await db.venueMembership.count({
        where: {
          userId,
          venue: { events: { some: { id: targetEventId } } },
        },
      });
      return count > 0;
    },
    findEventById: async (targetEventId) => db.event.findUnique({ where: { id: targetEventId }, select: { id: true, title: true, slug: true } }),
    listRegistrations: async () => [],
    countRegistrations: async () => 0,
    summarizeRegistrations: async () => ({ confirmed: 0, waitlisted: 0, cancelled: 0 }),
    prisma: db,
    enqueueNotification,
  });
}
