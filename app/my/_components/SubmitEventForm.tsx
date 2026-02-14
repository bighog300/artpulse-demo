"use client";

import { useState } from "react";
import ImageUploader from "@/app/my/_components/ImageUploader";
import { useRouter } from "next/navigation";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";
import { enqueueToast } from "@/lib/toast";

type ExistingSubmission = {
  eventId: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  decisionReason: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  isPublished: boolean;
  title: string;
  slug: string;
  startAt: string;
  timezone: string;
};

export default function SubmitEventForm({ venueId, existing }: { venueId: string; existing: ExistingSubmission[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>({ title: "", slug: "", timezone: "UTC", startAt: "", description: "", note: "", images: [] });
  const [issuesByEventId, setIssuesByEventId] = useState<Record<string, Array<{ field: string; message: string }>>>({});

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/my/venues/${venueId}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    if (res.status === 401) {
      window.location.href = buildLoginRedirectUrl(`/my/venues/${venueId}/submit-event`);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      enqueueToast({ title: body?.error?.message || "Failed to create event draft", variant: "error" });
      return;
    }
    enqueueToast({ title: "Draft event created", variant: "success" });
    router.refresh();
  }

  async function submit(eventId: string) {
    const res = await fetch(`/api/my/venues/${venueId}/events/${eventId}/submit`, { method: "POST" });
    if (res.status === 401) {
      window.location.href = buildLoginRedirectUrl(`/my/venues/${venueId}/submit-event`);
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const nextIssues = body?.error?.details?.issues;
      if (Array.isArray(nextIssues)) {
        setIssuesByEventId((current) => ({ ...current, [eventId]: nextIssues }));
      }
      enqueueToast({ title: body?.error?.message || "Failed to submit event", variant: "error" });
      return;
    }
    enqueueToast({ title: "Event submitted for review", variant: "success" });
    setIssuesByEventId((current) => ({ ...current, [eventId]: [] }));
    router.refresh();
  }

  const getStatusLabel = (item: ExistingSubmission) => {
    if (item.isPublished || item.status === "APPROVED") return "Published";
    if (item.status === "SUBMITTED") return "Pending review";
    if (item.status === "REJECTED") return "Needs changes";
    return "Draft";
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createDraft} className="space-y-2 max-w-2xl">
        <h2 className="text-lg font-semibold">Create event draft</h2>
        <input className="border rounded p-2 w-full" placeholder="Title" value={String(form.title ?? "")} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input className="border rounded p-2 w-full" placeholder="Slug" value={String(form.slug ?? "")} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
        <input className="border rounded p-2 w-full" placeholder="Timezone" value={String(form.timezone ?? "UTC")} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} />
        <input className="border rounded p-2 w-full" type="datetime-local" value={String(form.startAt ?? "")} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
        <textarea className="border rounded p-2 w-full" placeholder="Description" value={String(form.description ?? "")} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <ImageUploader
          label="Upload event image"
          onUploaded={({ assetId, url }) =>
            setForm((p) => ({
              ...p,
              images: [
                ...(Array.isArray(p.images) ? p.images : []),
                { assetId, url, sortOrder: Array.isArray(p.images) ? p.images.length : 0 },
              ],
            }))
          }
        />
        <textarea className="border rounded p-2 w-full" placeholder="Submission note" value={String(form.note ?? "")} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
        <button className="rounded border px-3 py-1">Create draft</button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Your venue event submissions</h2>
        <ul className="space-y-2 mt-2">
          {existing.map((item) => (
            <li key={item.eventId} className="border rounded p-2">
              <div className="font-medium">{item.title} ({item.status})</div>
              <div className="text-sm">Status: <span className="font-medium">{getStatusLabel(item)}</span></div>
              {item.submittedAt ? <div className="text-sm">Submitted: {new Date(item.submittedAt).toLocaleString()}</div> : null}
              {item.decidedAt ? <div className="text-sm">Decided: {new Date(item.decidedAt).toLocaleString()}</div> : null}
              {item.status === "REJECTED" && item.decisionReason ? <div className="text-sm text-red-700">Reviewer feedback: {item.decisionReason}</div> : null}
              {(issuesByEventId[item.eventId]?.length ?? 0) > 0 ? (
                <ul className="text-sm text-amber-800 list-disc pl-5 mt-2">
                  {issuesByEventId[item.eventId].map((issue, idx) => <li key={`${issue.field}-${idx}`}>{issue.message}</li>)}
                </ul>
              ) : null}
              {(item.status === "DRAFT" || item.status === "REJECTED") ? <button className="mt-2 rounded border px-2 py-1 text-sm" onClick={() => submit(item.eventId)}>{item.status === "REJECTED" ? "Resubmit" : "Submit for approval"}</button> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
