import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { resolveArtistCoverUrl } from "@/lib/artists";
import { ArtistProfileForm } from "@/components/artists/artist-profile-form";
import { ArtistGalleryManager } from "@/components/artists/artist-gallery-manager";

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
      name: true,
      bio: true,
      websiteUrl: true,
      instagramUrl: true,
      avatarImageUrl: true,
      featuredImageUrl: true,
      featuredAsset: { select: { url: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, alt: true, sortOrder: true, assetId: true, asset: { select: { url: true } } },
      },
    },
  });

  if (!artist) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">My Artist Profile</h1>
        <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No artist profile is linked to your account yet. Ask an editor to connect your Artist record to your user account.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Artist Profile</h1>
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
    </main>
  );
}
