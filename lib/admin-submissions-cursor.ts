export type SubmissionsCursor = { submittedAtISO: string; id: string };

export function encodeSubmissionsCursor(cursor: SubmissionsCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeSubmissionsCursor(cursor: string): SubmissionsCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<SubmissionsCursor>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.submittedAtISO !== "string") return null;
    if (!parsed.submittedAtISO || Number.isNaN(new Date(parsed.submittedAtISO).getTime())) return null;
    return { id: parsed.id, submittedAtISO: parsed.submittedAtISO };
  } catch {
    return null;
  }
}
