import { z } from "zod";
import { eventRevisionPatchSchema } from "@/lib/validators";

export type EventRevisionPatch = z.infer<typeof eventRevisionPatchSchema>;

export type RevisionEventSource = {
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  ticketUrl: string | null;
};

export function sanitizeRevisionPatch(input: unknown): EventRevisionPatch {
  return eventRevisionPatchSchema.parse(input);
}

export function buildEventRevisionSnapshot(event: RevisionEventSource, patch: EventRevisionPatch) {
  return {
    title: patch.title ?? event.title,
    description: Object.prototype.hasOwnProperty.call(patch, "description") ? patch.description ?? null : event.description,
    startAt: patch.startAt ? new Date(patch.startAt).toISOString() : event.startAt.toISOString(),
    endAt: Object.prototype.hasOwnProperty.call(patch, "endAt")
      ? (patch.endAt ? new Date(patch.endAt).toISOString() : null)
      : (event.endAt ? event.endAt.toISOString() : null),
    ticketUrl: Object.prototype.hasOwnProperty.call(patch, "ticketUrl") ? patch.ticketUrl ?? null : event.ticketUrl,
    images: patch.images,
  };
}

export function applyEventRevision(proposed: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (typeof proposed.title === "string") data.title = proposed.title;
  if (Object.prototype.hasOwnProperty.call(proposed, "description")) data.description = proposed.description ?? null;
  if (typeof proposed.startAt === "string") data.startAt = new Date(proposed.startAt);
  if (Object.prototype.hasOwnProperty.call(proposed, "endAt")) data.endAt = proposed.endAt ? new Date(String(proposed.endAt)) : null;
  if (Object.prototype.hasOwnProperty.call(proposed, "ticketUrl")) data.ticketUrl = proposed.ticketUrl ?? null;
  return data;
}

export function hasRevisionChanges(event: RevisionEventSource, proposed: ReturnType<typeof buildEventRevisionSnapshot>) {
  return (
    event.title !== proposed.title
    || event.description !== proposed.description
    || event.startAt.toISOString() !== proposed.startAt
    || (event.endAt ? event.endAt.toISOString() : null) !== proposed.endAt
    || event.ticketUrl !== proposed.ticketUrl
    || Array.isArray(proposed.images)
  );
}
