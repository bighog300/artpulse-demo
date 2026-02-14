import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildDetailMetadata, buildVenueJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { resolveVenueGalleryAltText } from "@/lib/venue-gallery";

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
  const venue = await db.venue.findFirst({
    where: { slug, isPublished: true },
    include: {
      featuredAsset: { select: { url: true, width: true, height: true, alt: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          url: true,
          alt: true,
          sortOrder: true,
          asset: { select: { url: true, width: true, height: true, alt: true } },
        },
      },
      events: { where: { isPublished: true } },
    },
  });

  if (!venue) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "VENUE", targetId: venue.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "VENUE", targetId: venue.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const featuredImageUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);

  const galleryImages = venue.images.flatMap((image) => {
    const src = resolveImageUrl(image.asset?.url, image.url);
    if (!src) {
      return [];
    }

    return [{
      id: image.id,
      src,
      alt: resolveVenueGalleryAltText({ imageAlt: image.alt, assetAlt: image.asset?.alt, venueName: venue.name }),
    }];
  });
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
      <Breadcrumbs items={[{ label: "Venues", href: "/venues" }, { label: venue.name, href: `/venues/${slug}` }]} />
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
      {galleryImages.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Gallery</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded border">
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
