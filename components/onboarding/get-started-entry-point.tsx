"use client";

import Link from "next/link";
import { useGetStartedState } from "@/components/onboarding/get-started-state";

export function GetStartedEntryPoint() {
  const { loading, progress } = useGetStartedState();

  if (loading || !progress || progress.completedAll) return null;

  return (
    <div className="rounded border bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">Finish your setup: {progress.completedCount}/{progress.totalCount} done.</p>
      <Link href="/get-started" className="mt-2 inline-block rounded border bg-card px-3 py-1 text-sm">
        Get started
      </Link>
    </div>
  );
}
