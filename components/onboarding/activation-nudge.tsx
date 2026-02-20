"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { getChecklistDismissed, getOnboardingState, getTipsState } from "@/lib/onboarding/state";

const DISMISSED_KEY = "ap_nudges_dismissed";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

export function ActivationNudge({
  nudgeId,
  page,
  title,
  body,
  ctaLabel,
  destination,
  enabled,
}: {
  nudgeId: string;
  page: string;
  title: string;
  body: string;
  ctaLabel: string;
  destination: string;
  enabled: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const shownRef = useRef(false);

  const suppressed = useMemo(() => {
    const onboarding = getOnboardingState();
    const tipsState = getTipsState();
    const checklistDismissed = getChecklistDismissed();
    return onboarding.dismissed || (onboarding.completed && (tipsState.seenIds.length > 0 || checklistDismissed || tipsState.dismissed));
  }, []);

  useEffect(() => {
    const ids = readDismissed();
    setDismissed(ids.includes(nudgeId));
  }, [nudgeId]);

  useEffect(() => {
    if (!enabled || dismissed || suppressed || shownRef.current) return;
    shownRef.current = true;
    track("activation_nudge_shown", { nudgeId, page });
  }, [dismissed, enabled, nudgeId, page, suppressed]);

  if (!enabled || dismissed || suppressed) return null;

  return (
    <aside className="rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{body}</p>
          <Link
            href={destination}
            className="inline-flex rounded border bg-background px-3 py-1 text-xs font-medium"
            onClick={() => track("activation_nudge_clicked", { nudgeId, destination })}
          >
            {ctaLabel}
          </Link>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          onClick={() => {
            const ids = readDismissed();
            writeDismissed([...ids, nudgeId]);
            setDismissed(true);
            track("activation_nudge_dismissed", { nudgeId, page });
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
