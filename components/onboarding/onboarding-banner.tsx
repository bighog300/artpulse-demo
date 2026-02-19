"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics/client";
import { setOnboardingDismissed, setOnboardingSeenAt } from "@/lib/onboarding/state";
import { OnboardingProgress, type OnboardingStepStatus } from "@/components/onboarding/onboarding-progress";
import { OnboardingSheet } from "@/components/onboarding/onboarding-sheet";

export function OnboardingBanner({
  page,
  steps,
  onDismiss,
  completionMessage,
  hasLocation,
  isAuthenticated,
}: {
  page: string;
  steps: OnboardingStepStatus[];
  onDismiss: () => void;
  completionMessage?: string | null;
  hasLocation: boolean;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOnboardingSeenAt();
    track("onboarding_banner_shown", { page });
  }, [page]);

  if (completionMessage) {
    return <aside className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm">{completionMessage}</aside>;
  }

  return (
    <aside className="space-y-3 rounded-lg border bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Set up your feed</h2>
          <p className="text-sm text-muted-foreground">Follow a few artists or venues, save a search, or save an event to activate your experience.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border bg-background px-3 py-1 text-sm"
            onClick={() => {
              setOpen(true);
              track("onboarding_sheet_opened", { page });
            }}
          >
            Get started
          </button>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => {
              setOnboardingDismissed(true);
              track("onboarding_dismissed", { page });
              onDismiss();
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
      <OnboardingProgress steps={steps.slice(0, 3)} />

      <OnboardingSheet open={open} onOpenChange={setOpen} page={page} steps={steps} hasLocation={hasLocation} isAuthenticated={isAuthenticated} />
    </aside>
  );
}
