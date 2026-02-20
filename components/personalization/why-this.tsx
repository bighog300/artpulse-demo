"use client";

import { useEffect } from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { track } from "@/lib/analytics/client";
import type { Explanation } from "@/lib/personalization/explanations";

type WhyThisProps = {
  source: string;
  explanation: Explanation;
  openLabel?: string;
};

export function WhyThis({ source, explanation, openLabel = "Why this?" }: WhyThisProps) {
  useEffect(() => {
    track("why_this_shown", { source, kind: explanation.kind });
  }, [source, explanation.kind]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground ui-trans hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`${openLabel} for this recommendation`}
          onClick={() => track("why_this_opened", { source, kind: explanation.kind })}
        >
          <Info className="h-3 w-3" aria-hidden="true" />
          {openLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Why you&apos;re seeing this</DialogTitle>
          <DialogDescription>{explanation.label}</DialogDescription>
        </DialogHeader>
        {explanation.detail ? <p className="text-sm text-muted-foreground">{explanation.detail}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
