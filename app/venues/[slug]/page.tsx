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
  return { title: slug, description: `Venue details for ${slug}` };
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

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{venue.name}</h1>
      <FollowButton
        targetType="VENUE"
        targetId={venue.id}
        initialIsFollowing={Boolean(existingFollow)}
        initialFollowersCount={followersCount}
        isAuthenticated={Boolean(user)}
      />
      {featuredImageUrl ? <img src={featuredImageUrl} alt={venue.name} className="h-64 w-full max-w-xl rounded border object-cover" /> : null}
      <p>{venue.description}</p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Place", name: venue.name }),
        }}
      />
    </main>
  );
}
