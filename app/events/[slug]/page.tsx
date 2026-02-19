import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { ShareButton } from "@/components/share-button";
import { SaveEventButton } from "@/components/events/save-event-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventRailCard } from "@/components/events/event-rail-card";
import { formatEventDateRange } from "@/components/events/event-format";
import { buildDetailMetadata, buildEventJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) return buildDetailMetadata({ kind: "event", slug });

  try {
    const event = await db.event.findFirst({ where: { slug, isPublished: true }, include: { images: { include: { asset: { select: { url: true } } }, orderBy: { sortOrder: "asc" } } } });
    if (!event) return buildDetailMetadata({ kind: "event", slug });
    const imageUrl = resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url);
    return buildDetailMetadata({ kind: "event", slug, title: event.title, description: event.description, imageUrl });
  } catch {
    return buildDetailMetadata({ kind: "event", slug });
  }
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) return <main className="p-6"><p>Set DATABASE_URL to view events locally.</p></main>;

  const { slug } = await params;
  const [event, user] = await Promise.all([
    db.event.findFirst({
      where: { slug, isPublished: true },
      include: {
        venue: true,
        eventTags: { include: { tag: true } },
        eventArtists: { include: { artist: { select: { id: true, slug: true, name: true } } } },
        images: { include: { asset: { select: { url: true } } }, orderBy: { sortOrder: "asc" } },
      },
    }),
    getSessionUser(),
  ]);
  if (!event) notFound();

  const similarEvents = await db.event.findMany({
    where: { isPublished: true, id: { not: event.id }, OR: [{ venueId: event.venueId ?? undefined }, { eventArtists: { some: { artistId: { in: event.eventArtists.map((ea) => ea.artistId) } } } }] },
    include: { venue: { select: { name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } } },
    orderBy: { startAt: "asc" },
    take: 4,
  });

  const isAuthenticated = Boolean(user);
  const initialSaved = user ? Boolean(await db.favorite.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "EVENT", targetId: event.id } }, select: { id: true } })) : false;
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

  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.startAt).toISOString().replace(/[-:]|\.\d{3}/g, "")}/${new Date(event.endAt ?? event.startAt).toISOString().replace(/[-:]|\.\d{3}/g, "")}`;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.title, href: `/events/${slug}` }]} />

      <section className="relative overflow-hidden rounded-2xl border border-border">
        <div className="relative h-64 md:h-80">
          {primaryImage ? <Image src={primaryImage} alt={event.images[0]?.alt ?? event.title} fill sizes="100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">No event image</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full space-y-3 p-5 text-white">
            <h1 className="text-2xl font-semibold md:text-4xl">{event.title}</h1>
            <p className="text-sm text-white/90">{formatEventDateRange(event.startAt, event.endAt)} · {event.venue?.name ?? "Venue TBA"}</p>
            <div className="flex flex-wrap gap-2">
              <SaveEventButton eventId={event.id} initialSaved={initialSaved} nextUrl={`/events/${slug}`} isAuthenticated={isAuthenticated} />
              <Button asChild variant="secondary" size="sm"><a href={calendarLink} target="_blank" rel="noreferrer">Add to Calendar</a></Button>
              <ShareButton />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <article className="space-y-2">
            <h2 className="text-lg font-semibold">About this event</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description || "Details coming soon."}</p>
          </article>

          {event.eventArtists.length ? (
            <article className="space-y-2">
              <h2 className="text-lg font-semibold">Lineup</h2>
              <div className="flex flex-wrap gap-2">
                {event.eventArtists.map((entry) => <Badge key={entry.artistId} variant="secondary">{entry.artist.name}</Badge>)}
              </div>
            </article>
          ) : null}

          {event.eventTags.length ? (
            <article className="space-y-2">
              <h2 className="text-lg font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {event.eventTags.map((eventTag) => <Badge key={eventTag.tag.id} variant="outline">{eventTag.tag.name}</Badge>)}
              </div>
            </article>
          ) : null}
        </div>

        <Card className="h-fit space-y-2 p-4">
          <h3 className="font-semibold">At a glance</h3>
          <p className="text-sm text-muted-foreground">{formatEventDateRange(event.startAt, event.endAt)}</p>
          <p className="text-sm text-muted-foreground">{event.venue?.name ?? "Venue TBA"}</p>
          <p className="text-sm text-muted-foreground">{event.venue?.addressLine1 ?? "Address unavailable"}</p>
          {event.venue?.slug ? <Link href={`/venues/${event.venue.slug}`} className="text-sm underline">View venue profile</Link> : null}
        </Card>
      </section>

      {similarEvents.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">You might also like</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {similarEvents.map((similar) => (
              <EventRailCard
                key={similar.id}
                href={`/events/${similar.slug}`}
                title={similar.title}
                startAt={similar.startAt}
                venueName={similar.venue?.name}
                imageUrl={resolveImageUrl(similar.images[0]?.asset?.url, similar.images[0]?.url ?? undefined)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
