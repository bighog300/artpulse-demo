"use client";

import { useSearchParams } from "next/navigation";
import { SaveSearchButton } from "@/components/saved-searches/save-search-button";

export function SearchSaveSearchInline() {
  const params = useSearchParams();
  const tags = (params.get("tags") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  return (
    <SaveSearchButton
      type="EVENTS_FILTER"
      params={{
        q: params.get("query") ?? undefined,
        from: params.get("from") ?? undefined,
        to: params.get("to") ?? undefined,
        tags,
        venue: params.get("venue") ?? undefined,
        artist: params.get("artist") ?? undefined,
        lat: params.get("lat") ? Number(params.get("lat")) : undefined,
        lng: params.get("lng") ? Number(params.get("lng")) : undefined,
        radiusKm: params.get("radiusKm") ? Number(params.get("radiusKm")) : undefined,
      }}
    />
  );
}
