import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import { ShareButton } from "@/components/share-button";
import { buildDetailMetadata, buildVenueJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) {
    return buildDetailMetadata({ kind: "venue", slug });
  }

  try {
    const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } } } });
    if (!venue) {
      return buildDetailMetadata({ kind: "venue", slug });
    }
    const imageUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);
    return buildDetailMetadata({ kind: "venue", slug, title: venue.name, description: venue.description, imageUrl });
  } catch {
    return buildDetailMetadata({ kind: "venue", slug });
  }
}

export default async function VenueDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const user = await getSessionUser();
  const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } }, events: { where: { isPublished: true } } } });

  if (!venue) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "VENUE", targetId: venue.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "VENUE", targetId: venue.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const featuredImageUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);
  const detailUrl = getDetailUrl("venue", slug);
  const jsonLd = buildVenueJsonLd({
    name: venue.name,
    description: venue.description,
    detailUrl,
    imageUrl: featuredImageUrl,
    websiteUrl: venue.websiteUrl,
    address: venue.addressLine1,
  });

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{venue.name}</h1>
      <ShareButton />
      <FollowButton
        targetType="VENUE"
        targetId={venue.id}
        initialIsFollowing={Boolean(existingFollow)}
        initialFollowersCount={followersCount}
        isAuthenticated={Boolean(user)}
      />
      {featuredImageUrl ? (
        <div className="relative h-64 w-full max-w-xl overflow-hidden rounded border">
          <Image src={featuredImageUrl} alt={venue.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      ) : null}
      <p>{venue.description}</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
