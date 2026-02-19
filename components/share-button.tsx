"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/client";

export function ShareButton({ eventSlug, ui = "detail" }: { eventSlug?: string; ui?: "detail" | "calendar_panel" }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ url: window.location.href });
        track("event_shared", { eventSlug, ui, method: "native" });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      track("event_shared", { eventSlug, ui, method: "copy" });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={handleShare} className="rounded border px-3 py-1 text-sm" aria-label="Copy page URL">
      {copied ? "Copied" : "Share"}
    </button>
  );
}
