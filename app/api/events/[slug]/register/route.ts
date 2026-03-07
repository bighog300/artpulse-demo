import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishedEventWhere } from "@/lib/publish-status";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handlePostRegistrationCreate } from "@/lib/registration-create-route";
import { enqueueNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function nanoid(size = 21) {
  let out = "";
  for (let i = 0; i < size; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? "A";
  }
  return out;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return handlePostRegistrationCreate(req, slug, {
    getSessionUser,
    findPublishedEventBySlug: async (eventSlug) => {
      const event = await db.event.findFirst({
        where: { slug: eventSlug, deletedAt: null, ...publishedEventWhere() },
        select: {
          id: true,
          slug: true,
          title: true,
          startAt: true,
          ticketingMode: true,
          capacity: true,
          rsvpClosesAt: true,
          venue: { select: { name: true, addressLine1: true, addressLine2: true, city: true, region: true, postcode: true, country: true } },
        },
      });
      if (!event) return null;
      return {
        ...event,
        venue: event.venue ? {
          name: event.venue.name,
          address: [event.venue.addressLine1, event.venue.addressLine2, event.venue.city, event.venue.region, event.venue.postcode, event.venue.country].filter(Boolean).join(", "),
        } : null,
      };
    },
    prisma: db,
    enforceRateLimit,
    now: () => new Date(),
    generateConfirmationCode: () => `AP-${nanoid(6).toUpperCase()}`,
    enqueueNotification,
  });
}
