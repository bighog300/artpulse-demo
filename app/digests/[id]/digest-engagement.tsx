"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEngagement } from "@/lib/engagement-client";
import { digestClickPayload } from "@/lib/digest-engagement";

type DigestItem = { slug: string; title: string; startAt: string; venueName: string | null };


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
        <li key={`${digestRunId}-${item.slug}`} className="rounded border p-3">
          <Link
            className="font-medium underline"
            href={`/events/${item.slug}`}
            onClick={() => trackEngagement(digestClickPayload({ digestRunId, targetId: item.slug, position: index }))}
          >
            {item.title}
          </Link>
          <p className="text-sm text-gray-600">{new Date(item.startAt).toLocaleString()}{item.venueName ? ` · ${item.venueName}` : ""}</p>
        </li>
      ))}
    </ul>
  );
}
