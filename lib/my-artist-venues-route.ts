import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMITS, enforceRateLimit, isRateLimitError, principalRateLimitKey, rateLimitErrorResponse } from "@/lib/rate-limit";
import { associationIdParamSchema, artistVenueRequestBodySchema, parseBody, zodDetails } from "@/lib/validators";
import { normalizeAssociationRole } from "@/lib/association-roles";

type SessionUser = { id: string };

type AssocStatus = "PENDING" | "APPROVED" | "REJECTED";

type AssocRecord = {
  id: string;
  status: AssocStatus;
  role: string | null;
  venueId: string;
};

type ArtistAssociationListItem = {
  id: string;
  status: AssocStatus;
  role: string | null;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  venue: { id: string; name: string; slug: string; cover: string | null };
};

type RequestDeps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<{ id: string } | null>;
  findPublishedVenueById: (venueId: string) => Promise<{ id: string } | null>;
  findAssociationByArtistAndVenue: (artistId: string, venueId: string) => Promise<AssocRecord | null>;
  createAssociation: (input: { artistId: string; venueId: string; role: string | null; message: string | null; requestedByUserId: string }) => Promise<AssocRecord>;
  rerequestAssociation: (associationId: string, input: { role: string | null; message: string | null; requestedByUserId: string }) => Promise<AssocRecord>;
};

type ListDeps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<{ id: string } | null>;
  listAssociationsByArtistId: (artistId: string) => Promise<ArtistAssociationListItem[]>;
};

type CancelDeps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<{ id: string } | null>;
  findAssociationById: (associationId: string) => Promise<{ id: string; artistId: string; status: AssocStatus } | null>;
  deleteAssociationById: (associationId: string) => Promise<void>;
};

function invalidRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: "invalid_request", message, details }, { status: 400 });
}

export async function handleRequestArtistVenueAssociation(req: NextRequest, deps: RequestDeps) {
  try {
    const user = await deps.requireAuth();
    await enforceRateLimit({
      key: principalRateLimitKey(req, `artist-venue-assoc-request:${user.id}`, user.id),
      limit: RATE_LIMITS.artistVenueAssocWrite.limit,
      windowMs: RATE_LIMITS.artistVenueAssocWrite.windowMs,
    });

    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return NextResponse.json({ error: "forbidden", message: "Artist profile required" }, { status: 403 });

    const parsedBody = artistVenueRequestBodySchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return invalidRequest("Invalid payload", zodDetails(parsedBody.error));

    const venue = await deps.findPublishedVenueById(parsedBody.data.venueId);
    if (!venue) return invalidRequest("Venue not found or unpublished");

    const existing = await deps.findAssociationByArtistAndVenue(artist.id, parsedBody.data.venueId);
    if (existing?.status === "APPROVED") return invalidRequest("Already associated");
    if (existing?.status === "PENDING") return invalidRequest("Already pending");

    const role = normalizeAssociationRole(parsedBody.data.role);
    const message = parsedBody.data.message ?? null;

    const association = existing?.status === "REJECTED"
      ? await deps.rerequestAssociation(existing.id, { role, message, requestedByUserId: user.id })
      : await deps.createAssociation({ artistId: artist.id, venueId: parsedBody.data.venueId, role, message, requestedByUserId: user.id });

    return NextResponse.json({ association: { id: association.id, status: association.status, role: association.role, venueId: association.venueId } });
  } catch (error) {
    if (isRateLimitError(error)) return rateLimitErrorResponse(error);
    if (error instanceof Error && error.message === "unauthorized") return NextResponse.json({ error: "unauthorized", message: "Authentication required" }, { status: 401 });
    return NextResponse.json({ error: "invalid_request", message: "Unexpected server error" }, { status: 500 });
  }
}

export async function handleListMyArtistVenueAssociations(_: NextRequest, deps: ListDeps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return NextResponse.json({ error: "forbidden", message: "Artist profile required" }, { status: 403 });

    const associations = await deps.listAssociationsByArtistId(artist.id);
    return NextResponse.json({
      pending: associations.filter((row) => row.status === "PENDING"),
      approved: associations.filter((row) => row.status === "APPROVED"),
      rejected: associations.filter((row) => row.status === "REJECTED"),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return NextResponse.json({ error: "unauthorized", message: "Authentication required" }, { status: 401 });
    return NextResponse.json({ error: "invalid_request", message: "Unexpected server error" }, { status: 500 });
  }
}

export async function handleCancelArtistVenueAssociation(_: NextRequest, params: Promise<{ associationId: string }>, deps: CancelDeps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return NextResponse.json({ error: "forbidden", message: "Artist profile required" }, { status: 403 });

    const parsed = associationIdParamSchema.safeParse(await params);
    if (!parsed.success) return invalidRequest("Invalid route parameter", zodDetails(parsed.error));

    const association = await deps.findAssociationById(parsed.data.associationId);
    if (!association || association.artistId !== artist.id) return NextResponse.json({ error: "forbidden", message: "Association not owned by artist" }, { status: 403 });
    if (association.status !== "PENDING") return invalidRequest("Only pending requests can be cancelled");

    await deps.deleteAssociationById(association.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return NextResponse.json({ error: "unauthorized", message: "Authentication required" }, { status: 401 });
    return NextResponse.json({ error: "invalid_request", message: "Unexpected server error" }, { status: 500 });
  }
}
