"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function toLocalDatetime(date: string) {
  const parsed = new Date(date);
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

export function EditEventForm({ event }: { event: { id: string; title: string; startAt: Date; endAt: Date | null } }) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [startAt, setStartAt] = useState(toLocalDatetime(event.startAt.toISOString()));
  const [endAt, setEndAt] = useState(event.endAt ? toLocalDatetime(event.endAt.toISOString()) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/my/events/${event.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : null,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? "Failed to save event");
      setSaving(false);
      return;
    }

    router.refresh();
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-3 rounded border p-4">
      <label className="block"><span className="text-sm">Title</span><input className="w-full rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block"><span className="text-sm">Start at</span><input className="w-full rounded border p-2" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></label>
      <label className="block"><span className="text-sm">End at</span><input className="w-full rounded border p-2" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
    </form>
  );
}
