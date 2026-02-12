"use client";

import { useState } from "react";

type SubmissionItem = {
  id: string;
  type: "EVENT" | "VENUE";
  note: string | null;
  submittedAt: string | null;
  submitter: { email: string; name: string | null };
  targetEvent: { title: string } | null;
  targetVenue: { name: string } | null;
};

export default function SubmissionsModeration({ items }: { items: SubmissionItem[] }) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    setMsg(null);
    const res = await fetch(`/api/admin/submissions/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, decisionReason: reasonById[id] || null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMsg(body?.error?.message || "Moderation action failed");
      return;
    }
    setMsg(`Submission ${action}d`);
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border rounded p-3 space-y-2">
            <div className="font-medium">{item.type} — {item.targetEvent?.title ?? item.targetVenue?.name ?? "Unknown target"}</div>
            <div className="text-sm">Submitter: {item.submitter.name ?? item.submitter.email}</div>
            {item.note ? <div className="text-sm">Note: {item.note}</div> : null}
            <input
              className="border rounded p-1 w-full"
              placeholder="Rejection reason"
              value={reasonById[item.id] || ""}
              onChange={(e) => setReasonById((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            <div className="space-x-2">
              <button className="rounded border px-2 py-1" onClick={() => decide(item.id, "approve")}>Approve</button>
              <button className="rounded border px-2 py-1" onClick={() => decide(item.id, "reject")}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
