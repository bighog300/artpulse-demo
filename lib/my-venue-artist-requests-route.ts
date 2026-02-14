import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMITS, enforceRateLimit, isRateLimitError, principalRateLimitKey, rateLimitErrorResponse } from "@/lib/rate-limit";
import { associationModerationParamsSchema, venueIdParamSchema, zodDetails } from "@/lib/validators";

type SessionUser = { id: string; email: string };
type AssocStatus = "PENDING" | "APPROVED" | "REJECTED";

type RequestItem = {
  id: string;
  venueId: string;
  role: string | null;
  message: string | null;
  createdAt: Date;
  artist: { id: string; name: string; slug: string; cover: string | null };
};

type ModerateAssoc = { id: string; venueId: string; status: AssocStatus; artist: { userId: string | null; name: string } };

type ListDeps = {
  requireAuth: () => Promise<SessionUser>;
  requireVenueMembership: (userId: string, venueId: string) => Promise<void>;
  listPendingForVenue: (venueId: string) => Promise<RequestItem[]>;
};

type ModerateDeps = {
  requireAuth: () => Promise<SessionUser>;
  requireVenueMembership: (userId: string, venueId: string) => Promise<void>;
  findAssociationById: (associationId: string) => Promise<ModerateAssoc | null>;
  updateAssociationStatus: (associationId: string, input: { status: AssocStatus; reviewedByUserId: string; reviewedAt: Date }) => Promise<{ id: string; status: AssocStatus }>;
  notifyArtistOwner?: (input: { userId: string; associationId: string; status: AssocStatus; artistName: string }) => Promise<void>;
};

function invalidRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: "invalid_request", message, details }, { status: 400 });
}

export async function handleListVenueArtistRequests(_: NextRequest, params: Promise<{ id: string }>, deps: ListDeps) {
  try {
    const parsed = venueIdParamSchema.safeParse(await params);
    if (!parsed.success) return invalidRequest("Invalid route parameter", zodDetails(parsed.error));

    const user = await deps.requireAuth();
    await deps.requireVenueMembership(user.id, parsed.data.id);

    const requests = await deps.listPendingForVenue(parsed.data.id);
    return NextResponse.json({ requests });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return NextResponse.json({ error: "unauthorized", message: "Authentication required" }, { status: 401 });
    if (error instanceof Error && error.message === "forbidden") return NextResponse.json({ error: "forbidden", message: "Venue membership required" }, { status: 403 });
    return NextResponse.json({ error: "invalid_request", message: "Unexpected server error" }, { status: 500 });
  }
}

export async function handleModerateVenueArtistRequest(
  req: NextRequest,
  params: Promise<{ id: string; associationId: string }>,
  status: "APPROVED" | "REJECTED",
  deps: ModerateDeps,
) {
  try {
    const parsed = associationModerationParamsSchema.safeParse(await params);
    if (!parsed.success) return invalidRequest("Invalid route parameter", zodDetails(parsed.error));

    const user = await deps.requireAuth();
    await deps.requireVenueMembership(user.id, parsed.data.id);

    await enforceRateLimit({
      key: principalRateLimitKey(req, `venue-assoc-moderation:${parsed.data.id}`, user.id),
      limit: RATE_LIMITS.venueAssocModerationWrite.limit,
      windowMs: RATE_LIMITS.venueAssocModerationWrite.windowMs,
    });

    const association = await deps.findAssociationById(parsed.data.associationId);
    if (!association || association.venueId !== parsed.data.id) return invalidRequest("Association not found");

    const updated = await deps.updateAssociationStatus(parsed.data.associationId, {
      status,
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    });

    if (deps.notifyArtistOwner && association.artist.userId) {
      await deps.notifyArtistOwner({ userId: association.artist.userId, associationId: association.id, status, artistName: association.artist.name });
    }

    return NextResponse.json({ association: updated });
  } catch (error) {
    if (isRateLimitError(error)) return rateLimitErrorResponse(error);
    if (error instanceof Error && error.message === "unauthorized") return NextResponse.json({ error: "unauthorized", message: "Authentication required" }, { status: 401 });
    if (error instanceof Error && error.message === "forbidden") return NextResponse.json({ error: "forbidden", message: "Venue membership required" }, { status: 403 });
    return NextResponse.json({ error: "invalid_request", message: "Unexpected server error" }, { status: 500 });
  }
}
