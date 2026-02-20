"use client";

import Link from "next/link";
import { useId, useState } from "react";

type WhyThisProps = { reasons: string[] };

export function WhyThis({ reasons }: WhyThisProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-2 rounded border border-border">
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm font-medium"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        Why am I seeing this?
      </button>
      {open ? (
        <div id={panelId} className="border-t px-3 py-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            {reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
          <Link href="/preferences" className="mt-2 inline-block text-xs underline">
            Improve recommendations in Preferences
          </Link>
        </div>
      ) : null}
    </div>
  );
}
