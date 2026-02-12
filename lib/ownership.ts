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
