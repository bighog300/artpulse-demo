import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handlePostCheckin } from "@/lib/checkin-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return handlePostCheckin(req, eventId, {
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
    findRegistrationByConfirmationCode: async (confirmationCode) => db.registration.findUnique({
      where: { confirmationCode },
      select: {
        id: true,
        eventId: true,
        guestName: true,
        status: true,
        checkedInAt: true,
        tier: { select: { name: true } },
      },
    }),
    setRegistrationCheckedInAt: async (registrationId, checkedInAt) => {
      const updated = await db.registration.update({
        where: { id: registrationId },
        data: { checkedInAt },
        select: { checkedInAt: true },
      });
      return updated.checkedInAt ?? checkedInAt;
    },
    now: () => new Date(),
  });
}
