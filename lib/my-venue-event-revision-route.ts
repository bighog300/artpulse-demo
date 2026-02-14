import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { RATE_LIMITS, enforceRateLimit, isRateLimitError, principalRateLimitKey, rateLimitErrorResponse } from "@/lib/rate-limit";
import { eventRevisionBodySchema, parseBody, venueEventSubmitParamSchema, zodDetails } from "@/lib/validators";
import { buildEventRevisionSnapshot, hasRevisionChanges, sanitizeRevisionPatch } from "@/lib/event-revision";

type SessionUser = { id: string; email: string };

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  ticketUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
};

type RevisionSubmission = { id: string; status: string; createdAt: Date; decisionReason: string | null; decidedAt: Date | null };

type RevisionDeps = {
  requireAuth: () => Promise<SessionUser>;
  requireVenueMembership: (userId: string, venueId: string) => Promise<void>;
  findEvent: (eventId: string, venueId: string) => Promise<EventRecord | null>;
  createRevisionSubmission: (input: { eventId: string; venueId: string; userId: string; proposed: Record<string, unknown>; baseEventUpdatedAt: string; message?: string }) => Promise<RevisionSubmission>;
  getLatestRevision: (eventId: string) => Promise<RevisionSubmission | null>;
};

export async function handleCreateEventRevision(req: NextRequest, params: Promise<{ venueId: string; eventId: string }>, deps: RevisionDeps) {
  try {
    const parsedParams = venueEventSubmitParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedParams.error));

    const user = await deps.requireAuth();
    await deps.requireVenueMembership(user.id, parsedParams.data.venueId);

    await enforceRateLimit({
      key: principalRateLimitKey(req, `event-revision:${parsedParams.data.venueId}`, user.id),
      limit: RATE_LIMITS.eventRevisionWrite.limit,
      windowMs: RATE_LIMITS.eventRevisionWrite.windowMs,
    });

    const parsedBody = eventRevisionBodySchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const event = await deps.findEvent(parsedParams.data.eventId, parsedParams.data.venueId);
    if (!event) return apiError(400, "invalid_request", "Event not found");
    if (!event.isPublished) return apiError(400, "invalid_request", "Only published events can receive revisions");

    const patch = sanitizeRevisionPatch(parsedBody.data.patch);
    const proposed = buildEventRevisionSnapshot(event, patch);
    if (!hasRevisionChanges(event, proposed)) return apiError(400, "invalid_request", "Revision patch must include at least one change");

    const revision = await deps.createRevisionSubmission({
      venueId: parsedParams.data.venueId,
      eventId: event.id,
      userId: user.id,
      proposed,
      baseEventUpdatedAt: event.updatedAt.toISOString(),
      message: parsedBody.data.message,
    });

    return NextResponse.json({
      revisionSubmission: {
        id: revision.id,
        status: revision.status,
        createdAt: revision.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (isRateLimitError(error)) return rateLimitErrorResponse(error);
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Venue membership required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function handleLatestEventRevision(params: Promise<{ venueId: string; eventId: string }>, deps: RevisionDeps) {
  try {
    const parsedParams = venueEventSubmitParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedParams.error));

    const user = await deps.requireAuth();
    await deps.requireVenueMembership(user.id, parsedParams.data.venueId);

    const revision = await deps.getLatestRevision(parsedParams.data.eventId);
    return NextResponse.json({
      revisionSubmission: revision ? {
        id: revision.id,
        status: revision.status,
        createdAt: revision.createdAt.toISOString(),
        reviewedAt: revision.decidedAt?.toISOString() ?? null,
        reviewerMessage: revision.decisionReason,
      } : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Venue membership required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
