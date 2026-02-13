"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGetStartedState } from "@/components/onboarding/get-started-state";
import { isGetStartedBannerDismissed, setGetStartedBannerDismissed } from "@/lib/get-started-banner-storage";

export function GetStartedBanner() {
  const { loading, progress } = useGetStartedState();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(isGetStartedBannerDismissed());
  }, []);

  if (dismissed || loading || !progress || progress.completedAll) return null;

  return (
    <aside className="flex items-center justify-between gap-3 rounded border bg-zinc-50 p-3">
      <p className="text-sm">Finish setup ({progress.completedCount}/{progress.totalCount}) for better recommendations.</p>
      <div className="flex items-center gap-3">
        <Link href="/get-started" className="text-sm underline">Finish setup →</Link>
        <button
          type="button"
          className="text-sm text-zinc-600 underline"
          onClick={() => {
            setDismissed(true);
            setGetStartedBannerDismissed(true);
          }}
        >
          Hide banner for now
        </button>
      </div>
    </aside>
  );
}
