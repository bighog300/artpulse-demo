import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { VenueSlugExhaustedError, ensureUniqueVenueSlugWithDeps, slugifyVenueName } from "@/lib/venue-slug";
import { myVenueCreateSchema, parseBody, zodDetails } from "@/lib/validators";

type SessionUser = { id: string; email?: string | null };

type VenueRecord = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
};

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findExistingManagedVenue: (params: { userId: string; createKey: string }) => Promise<VenueRecord | null>;
  findVenueBySlug: (slug: string) => Promise<{ id: string } | null>;
  createVenue: (data: {
    name: string;
    slug: string;
    city?: string | null;
    country?: string | null;
    websiteUrl?: string | null;
  }) => Promise<VenueRecord>;
  ensureOwnerMembership: (venueId: string, userId: string) => Promise<void>;
  upsertVenueDraftSubmission: (venueId: string, userId: string) => Promise<void>;
  setOnboardingFlag: (user: SessionUser) => Promise<void>;
  logAudit: (args: { action: string; user: SessionUser; venue: VenueRecord; reused: boolean; createKey: string; req: NextRequest }) => Promise<void>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function normalizeKeyPart(input?: string | null) {
  return (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildCreateKey(input: { name: string; city?: string | null; country?: string | null }) {
  return [normalizeKeyPart(input.name), normalizeKeyPart(input.city), normalizeKeyPart(input.country)].join("|");
}

export async function handlePostMyVenue(req: NextRequest, deps: Deps) {
  let user: SessionUser;
  try {
    user = await deps.requireAuth();
  } catch {
    return apiError(401, "unauthorized", "Authentication required");
  }

  try {
    const parsedBody = myVenueCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const createKey = buildCreateKey(parsedBody.data);
    const existing = await deps.findExistingManagedVenue({ userId: user.id, createKey });

    if (existing) {
      await deps.ensureOwnerMembership(existing.id, user.id);
      await deps.upsertVenueDraftSubmission(existing.id, user.id);
      await deps.setOnboardingFlag(user);
      await deps.logAudit({ action: "VENUE_CREATED_SELF_SERVE", user, venue: existing, reused: true, createKey, req });
      return NextResponse.json({ venue: existing, created: false }, { headers: NO_STORE_HEADERS });
    }

    const slugBase = slugifyVenueName(parsedBody.data.name);
    const slug = await ensureUniqueVenueSlugWithDeps(
      { findBySlug: deps.findVenueBySlug },
      slugBase,
      25,
    );
    if (!slug) return apiError(400, "invalid_request", "Name cannot be converted to a valid slug");

    const venue = await deps.createVenue({
      name: parsedBody.data.name,
      slug,
      city: parsedBody.data.city ?? null,
      country: parsedBody.data.country ?? null,
      websiteUrl: parsedBody.data.websiteUrl ?? null,
    });

    await deps.ensureOwnerMembership(venue.id, user.id);
    await deps.upsertVenueDraftSubmission(venue.id, user.id);
    await deps.setOnboardingFlag(user);
    await deps.logAudit({ action: "VENUE_CREATED_SELF_SERVE", user, venue, reused: false, createKey, req });

    return NextResponse.json({ venue, created: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof VenueSlugExhaustedError) return apiError(400, "invalid_request", error.message);
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export const __internal = { buildCreateKey };
