"use client";

import { useState } from "react";

type ExistingSubmission = {
  eventId: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  decisionReason: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  title: string;
  slug: string;
  startAt: string;
  timezone: string;
};

export default function SubmitEventForm({ venueId, existing }: { venueId: string; existing: ExistingSubmission[] }) {
  const [form, setForm] = useState<Record<string, unknown>>({ title: "", slug: "", timezone: "UTC", startAt: "", description: "", note: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch(`/api/my/venues/${venueId}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body?.error?.message || "Failed to create event draft");
      return;
    }
    setMessage("Draft event created. Refresh to see it in list.");
  }

  async function submit(eventId: string) {
    const res = await fetch(`/api/my/events/${eventId}/submit`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body?.error?.message || "Failed to submit event");
      return;
    }
    setMessage("Event submitted for moderation.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createDraft} className="space-y-2 max-w-2xl">
        <h2 className="text-lg font-semibold">Create event draft</h2>
        <input className="border rounded p-2 w-full" placeholder="Title" value={String(form.title ?? "")} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input className="border rounded p-2 w-full" placeholder="Slug" value={String(form.slug ?? "")} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
        <input className="border rounded p-2 w-full" placeholder="Timezone" value={String(form.timezone ?? "UTC")} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} />
        <input className="border rounded p-2 w-full" type="datetime-local" value={String(form.startAt ?? "")} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
        <textarea className="border rounded p-2 w-full" placeholder="Description" value={String(form.description ?? "")} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <textarea className="border rounded p-2 w-full" placeholder="Submission note" value={String(form.note ?? "")} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
        <button className="rounded border px-3 py-1">Create draft</button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Your venue event submissions</h2>
        <ul className="space-y-2 mt-2">
          {existing.map((item) => (
            <li key={item.eventId} className="border rounded p-2">
              <div className="font-medium">{item.title} ({item.status})</div>
              {item.submittedAt ? <div className="text-sm">Submitted: {new Date(item.submittedAt).toLocaleString()}</div> : null}
              {item.decidedAt ? <div className="text-sm">Decided: {new Date(item.decidedAt).toLocaleString()}</div> : null}
              {item.status === "REJECTED" && item.decisionReason ? <div className="text-sm text-red-700">Reason: {item.decisionReason}</div> : null}
              {(item.status === "DRAFT" || item.status === "REJECTED") ? <button className="mt-2 rounded border px-2 py-1 text-sm" onClick={() => submit(item.eventId)}>{item.status === "REJECTED" ? "Resubmit" : "Submit for approval"}</button> : null}
            </li>
          ))}
        </ul>
      </section>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
