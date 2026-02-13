"use client";

import { useEffect } from "react";
import { trackEngagement } from "@/lib/engagement-client";
import { digestClickPayload } from "@/lib/digest-engagement";
import { EventCard } from "@/components/events/event-card";

type DigestItem = {
  slug: string;
  title: string;
  startAt: string;
  venueName: string | null;
};

export function DigestEngagement({ digestRunId, items }: { digestRunId: string; items: DigestItem[] }) {
  useEffect(() => {
    trackEngagement({
      surface: "DIGEST",
      action: "VIEW",
      targetType: "DIGEST_RUN",
      targetId: digestRunId,
      meta: { digestRunId },
    });
  }, [digestRunId]);

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${digestRunId}-${item.slug}`} onClick={() => trackEngagement(digestClickPayload({ digestRunId, targetId: item.slug, position: index }))}>
          <EventCard href={`/events/${item.slug}`} title={item.title} startAt={item.startAt} venueName={item.venueName} badges={["Digest"]} />
        </li>
      ))}
    </ul>
  );
}
