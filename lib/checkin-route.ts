import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { parseBody } from "@/lib/validators";

type SessionUser = { id: string };

type RegistrationRecord = {
  id: string;
  eventId: string;
  guestName: string;
  status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED";
  checkedInAt: Date | null;
  tier: { name: string } | null;
};

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  hasEventVenueMembership: (eventId: string, userId: string) => Promise<boolean>;
  findRegistrationByConfirmationCode: (confirmationCode: string) => Promise<RegistrationRecord | null>;
  setRegistrationCheckedInAt: (registrationId: string, checkedInAt: Date) => Promise<Date>;
  now: () => Date;
};

const bodySchema = z.object({
  confirmationCode: z.string().trim().min(1).max(64),
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function handlePostCheckin(req: NextRequest, eventId: string, deps: Deps) {
  try {
    const user = await deps.requireAuth();
    const isMember = await deps.hasEventVenueMembership(eventId, user.id);
    if (!isMember) return apiError(403, "forbidden", "Venue membership required");

    const parsed = bodySchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload");

    const registration = await deps.findRegistrationByConfirmationCode(parsed.data.confirmationCode);
    if (!registration) return apiError(404, "not_found", "Registration not found");
    if (registration.eventId !== eventId) return apiError(400, "invalid_request", "Confirmation code is for a different event");
    if (registration.status !== "CONFIRMED") return apiError(400, "invalid_request", "Registration is not confirmed");
    if (registration.checkedInAt) return apiError(409, "conflict", "Attendee is already checked in");

    const checkedInAt = deps.now();
    const savedCheckedInAt = await deps.setRegistrationCheckedInAt(registration.id, checkedInAt);

    return NextResponse.json({
      ok: true,
      guestName: registration.guestName,
      tierName: registration.tier?.name ?? "General admission",
      checkedInAt: savedCheckedInAt.toISOString(),
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
