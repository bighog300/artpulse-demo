import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleGetMyEventRegistrationsCsv } from "@/lib/registration-list-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return handleGetMyEventRegistrationsCsv(req, eventId, {
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
    listRegistrations: async ({ eventId: targetEventId, skip, take }) => db.registration.findMany({
      where: { eventId: targetEventId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        confirmationCode: true,
        guestName: true,
        guestEmail: true,
        tierId: true,
        tier: { select: { name: true } },
        status: true,
        quantity: true,
        createdAt: true,
      },
    }).then((rows) => rows.map((row) => ({ ...row, tierName: row.tier?.name ?? null }))),
    countRegistrations: async () => 0,
    summarizeRegistrations: async () => ({ confirmed: 0, waitlisted: 0, cancelled: 0 }),
    prisma: db,
    enqueueNotification: (async () => null) as never,
  });
}
