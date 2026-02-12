export function submissionSubmittedDedupeKey(submissionId: string) {
  return `submission:${submissionId}:submitted`;
}

export function submissionDecisionDedupeKey(submissionId: string, status: "APPROVED" | "REJECTED") {
  return `submission:${submissionId}:${status.toLowerCase()}`;
}

export function inviteCreatedDedupeKey(inviteId: string) {
  return `invite:${inviteId}:created`;
}
