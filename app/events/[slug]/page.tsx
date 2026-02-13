import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildDetailMetadata, buildEventJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) {
    return buildDetailMetadata({ kind: "event", slug });
  }

  try {
    const event = await db.event.findFirst({
      where: { slug, isPublished: true },
      include: { images: { include: { asset: { select: { url: true } } }, orderBy: { sortOrder: "asc" } } },
    });

    if (!event) {
      return buildDetailMetadata({ kind: "event", slug });
    }

    const imageUrl = resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url);
    return buildDetailMetadata({ kind: "event", slug, title: event.title, description: event.description, imageUrl });
  } catch {
    return buildDetailMetadata({ kind: "event", slug });
  }
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const event = await db.event.findFirst({
    where: { slug, isPublished: true },
    include: { venue: true, eventTags: { include: { tag: true } }, images: { include: { asset: { select: { url: true } } }, orderBy: { sortOrder: "asc" } } },
  });

  if (!event) notFound();
  const primaryImage = resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url);
  const detailUrl = getDetailUrl("event", slug);
  const jsonLd = buildEventJsonLd({
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    detailUrl,
    imageUrl: primaryImage,
    venue: event.venue ? { name: event.venue.name, address: event.venue.addressLine1 } : undefined,
  });

  return (
    <main className="space-y-3 p-6">
      <Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.title, href: `/events/${slug}` }]} />
      <h1 className="text-3xl font-semibold">{event.title}</h1>
      <ShareButton />
      {primaryImage ? (
        <div className="relative h-64 w-full max-w-xl overflow-hidden rounded border">
          <Image src={primaryImage} alt={event.images[0]?.alt ?? event.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      ) : null}
      <p>{event.description}</p>
      <p>{new Date(event.startAt).toISOString()}</p>
      <form action="/api/favorites" method="post">
        <input type="hidden" name="targetType" value="EVENT" />
        <input type="hidden" name="targetId" value={event.id} />
        <button className="rounded border px-3 py-1">Save</button>
      </form>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
