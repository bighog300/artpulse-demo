"use client";

import { useEffect, useRef } from "react";

function isLikelyBot() {
  if (typeof navigator === "undefined") return false;
  return /bot|crawler|spider|headless|lighthouse/i.test(navigator.userAgent);
}

export function EntityPageViewTracker({ entityType, entityId }: { entityType: "ARTWORK" | "ARTIST" | "VENUE" | "EVENT"; entityId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !entityId || isLikelyBot()) return;
    fired.current = true;
    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
      keepalive: true,
    });
  }, [entityId, entityType]);

  return null;
}
