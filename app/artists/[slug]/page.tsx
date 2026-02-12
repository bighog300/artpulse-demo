import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Artist details for ${slug}` };
}

export default async function ArtistDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const user = await getSessionUser();
  const artist = await db.artist.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } }, eventArtists: { include: { event: true } } } });

  if (!artist) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "ARTIST", targetId: artist.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "ARTIST", targetId: artist.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const imageUrl = resolveImageUrl(artist.featuredAsset?.url, artist.avatarImageUrl);

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{artist.name}</h1>
      <FollowButton
        targetType="ARTIST"
        targetId={artist.id}
        initialIsFollowing={Boolean(existingFollow)}
        initialFollowersCount={followersCount}
        isAuthenticated={Boolean(user)}
      />
      {imageUrl ? <img src={imageUrl} alt={artist.name} className="h-64 w-full max-w-xl rounded border object-cover" /> : null}
      <p>{artist.bio}</p>
    </main>
  );
}
