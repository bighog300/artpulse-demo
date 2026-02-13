import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import { ShareButton } from "@/components/share-button";
import { buildArtistJsonLd, buildDetailMetadata, getDetailUrl } from "@/lib/seo.public-profiles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) {
    return buildDetailMetadata({ kind: "artist", slug });
  }

  try {
    const artist = await db.artist.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } } } });
    if (!artist) {
      return buildDetailMetadata({ kind: "artist", slug });
    }
    const imageUrl = resolveImageUrl(artist.featuredAsset?.url, artist.avatarImageUrl);
    return buildDetailMetadata({ kind: "artist", slug, title: artist.name, description: artist.bio, imageUrl });
  } catch {
    return buildDetailMetadata({ kind: "artist", slug });
  }
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
  const detailUrl = getDetailUrl("artist", slug);
  const jsonLd = buildArtistJsonLd({
    name: artist.name,
    description: artist.bio,
    detailUrl,
    imageUrl,
    websiteUrl: artist.websiteUrl,
  });

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{artist.name}</h1>
      <ShareButton />
      <FollowButton
        targetType="ARTIST"
        targetId={artist.id}
        initialIsFollowing={Boolean(existingFollow)}
        initialFollowersCount={followersCount}
        isAuthenticated={Boolean(user)}
      />
      {imageUrl ? (
        <div className="relative h-64 w-full max-w-xl overflow-hidden rounded border">
          <Image src={imageUrl} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      ) : null}
      <p>{artist.bio}</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
