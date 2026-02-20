import { notFound } from "next/navigation";
import EventAdminForm from "@/app/(admin)/admin/_components/EventAdminForm";
import { db } from "@/lib/db";

export default async function AdminEditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { eventTags: { include: { tag: true } }, eventArtists: { include: { artist: true } }, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();

  return (
    <EventAdminForm
      title="Edit Event"
      endpoint={`/api/admin/events/${id}`}
      method="PATCH"
      eventId={event.id}
      initial={{
        title: event.title,
        slug: event.slug,
        description: event.description,
        timezone: event.timezone,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString(),
        venueId: event.venueId,
        tagSlugs: event.eventTags.map((x) => x.tag.slug),
        artistSlugs: event.eventArtists.map((x) => x.artist.slug),
        images: event.images.map((x) => ({ url: x.url, alt: x.alt, sortOrder: x.sortOrder })),
        isPublished: event.isPublished,
      }}
    />
  );
}
