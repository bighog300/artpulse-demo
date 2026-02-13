"use client";

import Link from "next/link";
import type { MarkerEvent } from "@/lib/nearby-map";

export function EventPreviewCard({ event }: { event: MarkerEvent }) {
  return (
    <div className="space-y-2 rounded border bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold">{event.title}</p>
      <p className="text-xs text-gray-600">{new Date(event.startAt).toLocaleString()}</p>
      {event.venueName ? <p className="text-xs text-gray-600">{event.venueName}</p> : null}
      <Link className="inline-block rounded border px-3 py-1 text-sm" href={`/events/${event.slug}`}>
        View event
      </Link>
    </div>
  );
}
