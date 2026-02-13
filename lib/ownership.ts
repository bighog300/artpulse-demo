export type VenueRole = "OWNER" | "EDITOR";

const roleRank: Record<VenueRole, number> = {
  EDITOR: 1,
  OWNER: 2,
};

export function hasMinimumVenueRole(role: VenueRole, minRole: VenueRole) {
  return roleRank[role] >= roleRank[minRole];
}

export function canEditSubmission(status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED") {
  return status === "DRAFT" || status === "REJECTED";
}

export function canResubmitSubmission(status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED") {
  return status === "DRAFT" || status === "REJECTED";
}

export function canManageVenueMembers(role: VenueRole, isGlobalAdmin: boolean) {
  return isGlobalAdmin || role === "OWNER";
}

export function canRemoveOwnerMember(ownerCount: number, targetRole: VenueRole) {
  if (targetRole !== "OWNER") return true;
  return ownerCount > 1;
}

export function nextSubmissionStatusForSubmit(status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED") {
  return canResubmitSubmission(status) ? "SUBMITTED" : null;
}

export function canAccessSavedSearch(ownerUserId: string, requesterUserId: string) {
  return ownerUserId === requesterUserId;
}
