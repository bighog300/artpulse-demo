"use client";

import { useState } from "react";

export function SaveSearchButton({ type, params }: { type: "NEARBY" | "EVENTS_FILTER"; params: Record<string, unknown> }) {
  const [message, setMessage] = useState<string | null>(null);

  const onSave = async () => {
    const name = window.prompt("Name this search");
    if (!name) return;
    const response = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, name, params }),
    });
    setMessage(response.ok ? "Saved search created." : "Could not save search.");
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => void onSave()}>Save this search</button>
      {message ? <span className="text-xs text-gray-600">{message}</span> : null}
    </div>
  );
}
