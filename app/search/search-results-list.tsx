"use client";

import Link from "next/link";
import { trackEngagement } from "@/lib/engagement-client";

type SearchResult = { id: string; slug: string; title: string };

export function SearchResultsList({ items, query }: { items: SearchResult[]; query?: string }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.id}>
          <Link
            className="underline"
            href={`/events/${item.slug}`}
            onClick={() => trackEngagement({ surface: "SEARCH", action: "CLICK", targetType: "EVENT", targetId: item.id, meta: { position: index, query: query?.slice(0, 120) } })}
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
