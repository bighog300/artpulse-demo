import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { formatEventDateRange, formatEventDayMonth } from "@/components/events/event-format";
import { cn } from "@/lib/utils";

type EventCardProps = {
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null | undefined;
  venueName?: string | null | undefined;
  venueSlug?: string | null | undefined;
  imageUrl?: string | null;
  href: string;
  badges?: string[];
  tags?: string[];
  secondaryText?: string;
  action?: ReactNode;
  distanceLabel?: string;
  className?: string;
};

export function EventCard({ title, startAt, endAt, venueName, imageUrl, href, badges, tags, secondaryText, action, distanceLabel, className }: EventCardProps) {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = endAt ? (typeof endAt === "string" ? new Date(endAt) : endAt) : undefined;
  const hasValidStart = !Number.isNaN(start.getTime());
  const dayMonth = hasValidStart ? formatEventDayMonth(start) : null;
  const dateRange = hasValidStart ? formatEventDateRange(start, end) : null;
  const chips = badges ?? tags;

  return (
    <article className={cn("group overflow-hidden rounded-xl border border-border bg-card shadow-sm ui-hover-lift ui-press", className)}>
      <Link
        href={href}
        aria-label={`Open event ${title}`}
        className="block focus-visible:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover ui-trans motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-visible:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">No event image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {dayMonth ? (
            <div className="absolute left-3 top-3 rounded-md bg-background/95 px-2 py-1 text-center text-xs font-semibold leading-tight text-foreground">
              <p>{dayMonth.day}</p>
              <p className="uppercase text-[10px] text-muted-foreground">{dayMonth.month}</p>
            </div>
          ) : null}
          {distanceLabel ? <Badge className="absolute right-3 top-3 bg-background/90 text-foreground">{distanceLabel}</Badge> : null}
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {dateRange ? <p className="text-sm text-muted-foreground">{dateRange}</p> : null}
          {secondaryText ? <p className="text-sm text-muted-foreground">{secondaryText}</p> : null}
          {venueName ? <p className="line-clamp-1 text-sm text-muted-foreground">{venueName}</p> : null}
          {chips?.length ? (
            <div className="flex flex-wrap gap-1">
              {chips.slice(0, 2).map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
      {action ? <div className="border-t border-border p-3">{action}</div> : null}
    </article>
  );
}
