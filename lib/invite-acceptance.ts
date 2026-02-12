import type { VenueMembershipRole, VenueInviteStatus } from "@prisma/client";

export type InviteRecord = {
  id: string;
  token: string;
  venueId: string;
  email: string;
  role: VenueMembershipRole;
  status: VenueInviteStatus;
  expiresAt: Date;
};

export type AcceptInviteResult =
  | { ok: true; inviteStatus: "ACCEPTED"; venueId: string; membershipRole: VenueMembershipRole }
  | { ok: false; code: "not_found" | "invalid_state" | "forbidden"; message: string; markExpired?: boolean };

export function evaluateInviteAcceptance(params: {
  invite: InviteRecord | null;
  authenticatedEmail: string;
  now?: Date;
}) : AcceptInviteResult {
  const now = params.now ?? new Date();
  if (!params.invite) return { ok: false, code: "not_found", message: "Invite not found" };
  if (params.invite.status !== "PENDING") return { ok: false, code: "invalid_state", message: "Invite is no longer pending" };
  if (params.invite.expiresAt <= now) {
    return { ok: false, code: "invalid_state", message: "Invite has expired", markExpired: true };
  }
  if (params.invite.email !== params.authenticatedEmail.toLowerCase()) {
    return { ok: false, code: "forbidden", message: "Invite email does not match authenticated user" };
  }

  return {
    ok: true,
    inviteStatus: "ACCEPTED",
    venueId: params.invite.venueId,
    membershipRole: params.invite.role,
  };
}
