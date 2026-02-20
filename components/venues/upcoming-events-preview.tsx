import Image from "next/image";
import Link from "next/link";

type UpcomingEventItem = {
  id: string;
  slug: string;
  title: string;
  startAtIso: string;
  imageUrl?: string | null;
};

type UpcomingEventsPreviewProps = {
  items: UpcomingEventItem[];
  viewAllHref: string;
};

export function UpcomingEventsPreview({ items, viewAllHref }: UpcomingEventsPreviewProps) {
  return (
    <section className="space-y-3 rounded-xl border p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Upcoming events</h2>
        <Link className="text-sm font-medium underline" href={viewAllHref}>View all events</Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">No upcoming events yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((event) => {
            const dateText = new Date(event.startAtIso).toLocaleDateString();
            return (
              <li key={event.id} className="flex gap-3 rounded border p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  {event.imageUrl ? (
                    <Image src={event.imageUrl} alt={event.title} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{dateText}</p>
                  <Link href={`/events/${event.slug}`} className="line-clamp-2 font-medium hover:underline">{event.title}</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
