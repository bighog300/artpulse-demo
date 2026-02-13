"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
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
