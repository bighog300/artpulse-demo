"use client";

import type { StartPackDefinition } from "@/lib/onboarding/start-packs";

export function StartPackCard({ pack, onOpen }: { pack: StartPackDefinition; onOpen: (pack: StartPackDefinition) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(pack)}
      className="min-w-56 rounded-lg border bg-background p-3 text-left ui-trans hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="text-sm font-semibold">{pack.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{pack.type === "mixed" ? "Artists + Venues" : pack.type === "artist" ? "Artists" : "Venues"}</p>
    </button>
  );
}
