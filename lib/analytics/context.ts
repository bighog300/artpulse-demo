import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track, type AnalyticsProps, type AnalyticsEventName } from "@/lib/analytics/client";

export function useTrackPageView(name: AnalyticsEventName, props?: AnalyticsProps) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    track(name, props);
  }, [name, pathname, props]);
}
