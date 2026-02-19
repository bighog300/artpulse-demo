import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatEventDateRange, formatEventDayMonth } from "@/components/events/event-format";

type EventRailCardProps = {
  href: string;
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  venueName?: string | null;
  imageUrl?: string | null;
  distanceLabel?: string;
};

export function EventRailCard({ href, title, startAt, endAt, venueName, imageUrl, distanceLabel }: EventRailCardProps) {
  const dayMonth = formatEventDayMonth(startAt);
  return (
    <Link href={href} className="group flex min-w-[300px] gap-3 rounded-xl border border-border bg-card p-3 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`Open event ${title}`}>
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? <Image src={imageUrl} alt={title} fill sizes="112px" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{dayMonth.day} {dayMonth.month}</span>
          {distanceLabel ? <Badge variant="secondary">{distanceLabel}</Badge> : null}
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{venueName || "Venue TBA"}</p>
        <p className="text-xs text-muted-foreground">{formatEventDateRange(startAt, endAt)}</p>
      </div>
    </Link>
  );
}
