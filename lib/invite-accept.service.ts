import type { VenueInvite, VenueMembership } from "@prisma/client";
import { evaluateInviteAcceptance } from "./invite-acceptance";

type Deps = {
  findInviteByToken: (token: string) => Promise<VenueInvite | null>;
  markInviteExpired: (inviteId: string) => Promise<void>;
  upsertMembership: (input: { userId: string; venueId: string; role: VenueMembership["role"] }) => Promise<VenueMembership>;
  markInviteAccepted: (inviteId: string, acceptedAt: Date) => Promise<void>;
};

export async function acceptInviteWithDeps(
  deps: Deps,
  input: { token: string; userId: string; userEmail: string; now?: Date },
) {
  const now = input.now ?? new Date();
  const invite = await deps.findInviteByToken(input.token);
  const evaluation = evaluateInviteAcceptance({ invite, authenticatedEmail: input.userEmail, now });

  if (!evaluation.ok) {
    if (evaluation.markExpired && invite) await deps.markInviteExpired(invite.id);
    return evaluation;
  }

  const membership = await deps.upsertMembership({
    userId: input.userId,
    venueId: evaluation.venueId,
    role: evaluation.membershipRole,
  });

  if (invite) {
    await deps.markInviteAccepted(invite.id, now);
  }

  return {
    ok: true as const,
    venueId: evaluation.venueId,
    membership,
  };
}
