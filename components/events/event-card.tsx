import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { formatEventDateRange, formatEventDayMonth } from "@/components/events/event-format";
import { cn } from "@/lib/utils";

type EventCardProps = {
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  venueName?: string | null;
  imageUrl?: string | null;
  href: string;
  badges?: string[];
  secondaryText?: string;
  action?: ReactNode;
  distanceLabel?: string;
  className?: string;
};

export function EventCard({ title, startAt, endAt, venueName, imageUrl, href, badges, secondaryText, action, distanceLabel, className }: EventCardProps) {
  const dayMonth = formatEventDayMonth(startAt);
  const dateRange = formatEventDateRange(startAt, endAt);

  return (
    <article className={cn("group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg", className)}>
      <Link
        href={href}
        aria-label={`Open event ${title}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">No event image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute left-3 top-3 rounded-md bg-background/95 px-2 py-1 text-center text-xs font-semibold leading-tight text-foreground">
            <p>{dayMonth.day}</p>
            <p className="uppercase text-[10px] text-muted-foreground">{dayMonth.month}</p>
          </div>
          {distanceLabel ? <Badge className="absolute right-3 top-3 bg-background/90 text-foreground">{distanceLabel}</Badge> : null}
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{dateRange}</p>
          {secondaryText ? <p className="text-sm text-muted-foreground">{secondaryText}</p> : null}
          {venueName ? <p className="line-clamp-1 text-sm text-muted-foreground">{venueName}</p> : null}
          {badges?.length ? (
            <div className="flex flex-wrap gap-1">
              {badges.slice(0, 2).map((badge) => (
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
