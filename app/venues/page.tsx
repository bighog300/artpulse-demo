import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { mapNextUpcomingEventByVenueId } from "@/lib/venue-events";
import { resolveVenueCoverUrl } from "@/lib/venues";

export const revalidate = 300;

export default async function VenuesPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Venues</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const items = await db.venue.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      featuredImageUrl: true,
      featuredAsset: { select: { url: true } },
    },
  });

  const upcomingEvents = await db.event.findMany({
    where: { isPublished: true, startAt: { gte: new Date() }, venueId: { in: items.map((venue) => venue.id), not: null } },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    select: { venueId: true, slug: true, title: true, startAt: true },
  });

  const nextByVenueId = mapNextUpcomingEventByVenueId(upcomingEvents.map((event) => ({ ...event, venueId: event.venueId! })));

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Venues</h1>
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((venue) => {
          const coverUrl = resolveVenueCoverUrl(venue);
          const nextEvent = nextByVenueId.get(venue.id);

          return (
            <li key={venue.id} className="rounded border overflow-hidden">
              <Link href={`/venues/${venue.slug}`} className="block">
                <div className="relative aspect-[16/9] w-full bg-zinc-100">
                  {coverUrl ? (
                    <Image src={coverUrl} alt={venue.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500">No cover image</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h2 className="text-lg font-semibold">{venue.name}</h2>
                  <p className="text-sm text-zinc-600 line-clamp-2">{venue.description ?? "Discover upcoming art events at this venue."}</p>
                  {nextEvent ? (
                    <p className="text-sm text-zinc-700">
                      Next event: <span className="font-medium">{nextEvent.title}</span> · {nextEvent.startAt.toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500">No upcoming events</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
