import Link from "next/link";
import type { ReactNode } from "react";
import { formatEventDateRange, formatEventDayMonth } from "@/components/events/event-format";

type EventRowProps = {
  href: string;
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  venueName?: string | null;
  action?: ReactNode;
};

export function EventRow({ href, title, startAt, endAt, venueName, action }: EventRowProps) {
  const dayMonth = formatEventDayMonth(startAt);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="w-14 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        <p>{dayMonth.day}</p>
        <p>{dayMonth.month}</p>
      </div>
      <Link href={href} className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`Open event ${title}`}>
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{formatEventDateRange(startAt, endAt)}</p>
      </Link>
      <p className="hidden max-w-40 truncate text-xs text-muted-foreground sm:block">{venueName || "Venue TBA"}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
