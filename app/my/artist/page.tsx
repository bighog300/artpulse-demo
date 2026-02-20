import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { resolveArtistCoverUrl } from "@/lib/artists";
import { ArtistProfileForm } from "@/components/artists/artist-profile-form";
import { ArtistGalleryManager } from "@/components/artists/artist-gallery-manager";
import { getArtistPublishIssues } from "@/lib/artist-publish";
import { ArtistPublishPanel } from "@/app/my/_components/ArtistPublishPanel";
import { ArtistVenuesPanel } from "@/components/artists/artist-venues-panel";

export default async function MyArtistPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/artist");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">My Artist Profile</h1>
        <p>Set DATABASE_URL to manage your artist profile locally.</p>
      </main>
    );
  }

  const artist = await db.artist.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      name: true,
      bio: true,
      websiteUrl: true,
      instagramUrl: true,
      avatarImageUrl: true,
      featuredAssetId: true,
      featuredImageUrl: true,
      featuredAsset: { select: { url: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, alt: true, sortOrder: true, assetId: true, asset: { select: { url: true } } },
      },
      venueAssociations: { select: { id: true } },
      targetSubmissions: {
        where: { type: "ARTIST", kind: "PUBLISH" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, submittedAt: true, decisionReason: true },
      },
    },
  });

  if (!artist) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">My Artist Profile</h1>
        <p className="rounded border border-dashed p-4 text-sm text-muted-foreground">No artist profile is linked to your account yet. Ask an editor to connect your Artist record to your user account.</p>
      </main>
    );
  }

  const latestSubmission = artist.targetSubmissions[0] ?? null;
  const publishedVenues = await db.venue.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
    take: 100,
  });

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Artist Profile</h1>
      <ArtistPublishPanel
        artistSlug={artist.slug}
        isPublished={artist.isPublished}
        submissionStatus={latestSubmission?.status ?? null}
        submittedAt={latestSubmission?.submittedAt?.toISOString() ?? null}
        decisionReason={latestSubmission?.decisionReason ?? null}
        initialIssues={getArtistPublishIssues({
          name: artist.name,
          bio: artist.bio,
          websiteUrl: artist.websiteUrl,
          featuredAssetId: artist.featuredAssetId,
          featuredImageUrl: artist.featuredImageUrl,
          images: artist.images.map((image) => ({ id: image.id })),
        })}
      />
      <ArtistProfileForm
        initialProfile={{
          name: artist.name,
          bio: artist.bio,
          websiteUrl: artist.websiteUrl,
          instagramUrl: artist.instagramUrl,
          avatarImageUrl: artist.avatarImageUrl,
        }}
      />
      <ArtistGalleryManager
        initialImages={artist.images}
        initialCover={resolveArtistCoverUrl(artist)}
      />
      <ArtistVenuesPanel initialVenues={publishedVenues} />
    </main>
  );
}
