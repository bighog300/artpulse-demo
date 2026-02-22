import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { ensureUniqueArtistSlugWithDeps, slugifyArtistName } from "@/lib/artist-slug";
import { myArtistCreateSchema, parseBody, zodDetails } from "@/lib/validators";

type SessionUser = { id: string; email?: string | null };

type ArtistRecord = { id: string; slug: string };

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<ArtistRecord | null>;
  findArtistBySlug: (slug: string) => Promise<{ id: string } | null>;
  createArtist: (data: { userId: string; name: string; slug: string; websiteUrl?: string | null }) => Promise<ArtistRecord>;
  upsertArtistSubmission: (artistId: string, userId: string) => Promise<void>;
  setOnboardingFlag: (user: SessionUser) => Promise<void>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function handlePostMyArtist(req: NextRequest, deps: Deps) {
  let user: SessionUser;
  try {
    user = await deps.requireAuth();
  } catch {
    return apiError(401, "unauthorized", "Authentication required");
  }

  try {
    const existing = await deps.findOwnedArtistByUserId(user.id);
    if (existing) return NextResponse.json({ ok: true, artistId: existing.id, slug: existing.slug }, { headers: NO_STORE_HEADERS });

    const parsedBody = myArtistCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const slug = await ensureUniqueArtistSlugWithDeps(
      { findBySlug: deps.findArtistBySlug },
      slugifyArtistName(parsedBody.data.name),
    );

    if (!slug) return apiError(400, "invalid_request", "Name cannot be converted to a valid slug");

    const artist = await deps.createArtist({
      userId: user.id,
      name: parsedBody.data.name,
      slug,
      websiteUrl: parsedBody.data.websiteUrl ?? null,
    });

    await deps.upsertArtistSubmission(artist.id, user.id);
    await deps.setOnboardingFlag(user);

    return NextResponse.json({ ok: true, artistId: artist.id, slug: artist.slug }, { headers: NO_STORE_HEADERS });
  } catch {
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
