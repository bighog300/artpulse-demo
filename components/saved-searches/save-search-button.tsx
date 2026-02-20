"use client";

import { useMemo, useState } from "react";
import { trackEngagement } from "@/lib/engagement-client";
import { enqueueToast } from "@/lib/toast";
import { EventCard } from "@/components/events/event-card";

type PreviewItem = {
  id: string;
  title: string;
  slug: string;
  startAt: string;
  venue?: { name: string | null } | null;
};

export function canSaveFromPreview(name: string, previewCount: number) {
  void previewCount;
  return name.trim().length > 0;
}

export function SaveSearchButton({ type, params }: { type: "NEARBY" | "EVENTS_FILTER"; params: Record<string, unknown> }) {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => canSaveFromPreview(name, preview?.length ?? 0), [name, preview]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    setPreviewMessage(null);
    const response = await fetch("/api/saved-searches/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, params }),
    });
    if (!response.ok) {
      setPreview([]);
      setPreviewMessage("Could not load preview.");
      setLoadingPreview(false);
      return;
    }
    const data = (await response.json()) as { items: PreviewItem[] };
    setPreview(data.items.slice(0, 10));
    if (data.items.length === 0) {
      setPreviewMessage("No upcoming events match yet");
    }
    setLoadingPreview(false);
  };

  const onOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && preview == null) await loadPreview();
  };

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, name: name.trim(), params }),
      });
      if (!response.ok) {
        setMessage("Could not save search.");
        enqueueToast({ title: "Could not save search", variant: "error" });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      const saved = (await response.json()) as { id: string };
      trackEngagement({ surface: "SEARCH", action: "SAVE_SEARCH", targetType: "SAVED_SEARCH", targetId: saved.id });
      enqueueToast({ title: "Saved search created", variant: "success" });
      setMessage("Saved ✓");
      setName("");
      setOpen(false);
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage("Could not save search.");
      enqueueToast({ title: "Could not save search", variant: "error" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2">
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => void onOpen()} disabled={saving}>{saving ? "Saving..." : "Save this search"}</button>
        {message ? <span className={`text-xs ${message.includes("Could not") ? "text-red-700" : "text-green-700"}`}>{message}</span> : null}
      </div>
      {open ? (
        <div className="max-w-lg rounded border p-3">
          <label className="block text-sm font-medium" htmlFor="saved-search-name">Name</label>
          <input id="saved-search-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border p-2 text-sm" placeholder="Weekly openings nearby" />
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</p>
            {loadingPreview ? <p className="text-sm text-gray-600">Loading preview…</p> : null}
            {previewMessage ? <p className="text-sm text-gray-600">{previewMessage}</p> : null}
            {(preview ?? []).length > 0 ? (
              <ul className="space-y-2">
                {preview?.map((item) => (
                  <li key={item.id}>
                    <EventCard href={`/events/${item.slug}`} title={item.title} startAt={item.startAt} venueName={item.venue?.name} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={!canSave || loadingPreview || saving}
              className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
