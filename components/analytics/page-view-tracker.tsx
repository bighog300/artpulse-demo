"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEventName, type AnalyticsProps } from "@/lib/analytics/client";

export function PageViewTracker({ name, props }: { name: AnalyticsEventName; props?: AnalyticsProps }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(name, props);
  }, [name, props]);

  return null;
}
