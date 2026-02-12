import crypto from "crypto";
import { VenueInvite, VenueMembershipRole } from "@prisma/client";
import { db } from "@/lib/db";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getInviteExpiryDate(now = new Date()) {
  return new Date(now.getTime() + INVITE_TTL_MS);
}

export function generateInviteToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export async function createOrRefreshVenueInvite(params: {
  venueId: string;
  email: string;
  role: VenueMembershipRole;
  invitedByUserId: string;
}) {
  const normalizedEmail = params.email.trim().toLowerCase();
  const now = new Date();
  const existingPending = await db.venueInvite.findFirst({
    where: {
      venueId: params.venueId,
      email: normalizedEmail,
      status: "PENDING",
    },
  });

  const token = generateInviteToken();
  const expiresAt = getInviteExpiryDate(now);

  if (existingPending) {
    return db.venueInvite.update({
      where: { id: existingPending.id },
      data: {
        role: params.role,
        token,
        invitedByUserId: params.invitedByUserId,
        expiresAt,
      },
    });
  }

  return db.venueInvite.create({
    data: {
      venueId: params.venueId,
      email: normalizedEmail,
      role: params.role,
      token,
      invitedByUserId: params.invitedByUserId,
      expiresAt,
    },
  });
}

export function normalizeInviteStatus(invite: VenueInvite, now = new Date()) {
  if (invite.status === "PENDING" && invite.expiresAt <= now) {
    return "EXPIRED" as const;
  }
  return invite.status;
}
