"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { enqueueToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/ui/inline-banner";

type ModerationItem = {
  entityType: "ARTIST" | "VENUE" | "EVENT";
  submissionId: string;
  entityId: string;
  title: string;
  slug: string | null;
  submittedAtISO: string;
  creator?: { id: string; email?: string | null; name?: string | null };
  summary?: string | null;
  details: Record<string, unknown> | null;
};

export default function ModerationClient({ initialItems }: { initialItems: ModerationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState<"ALL" | "ARTIST" | "VENUE" | "EVENT">("ALL");
  const [active, setActive] = useState<ModerationItem | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => tab === "ALL" ? items : items.filter((item) => item.entityType === tab), [items, tab]);

  async function decide(action: "approve" | "reject") {
    if (!active) return;
    if (action === "reject" && reason.trim().length < 5) {
      setError("Rejection feedback must be at least 5 characters.");
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/moderation/${active.entityType.toLowerCase()}/${active.submissionId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: action === "reject" ? JSON.stringify({ rejectionReason: reason }) : undefined,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error === "ALREADY_DECIDED" ? "This submission was already decided." : body?.error?.message ?? "Action failed.");
      return;
    }

    setItems((current) => current.filter((item) => item.submissionId !== active.submissionId));
    enqueueToast({ title: action === "approve" ? "Approved" : "Rejected" });
    setActive(null);
    setReason("");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["ALL", "ARTIST", "VENUE", "EVENT"] as const).map((option) => (
          <Button key={option} variant={tab === option ? "default" : "outline"} onClick={() => setTab(option)}>{option === "ALL" ? "All" : `${option[0]}${option.slice(1).toLowerCase()}s`}</Button>
        ))}
      </div>
      <div className="rounded-lg border bg-background">
        {filtered.map((item) => (
          <div key={item.submissionId} className="flex items-center justify-between border-b p-3 last:border-b-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2"><Badge>{item.entityType}</Badge><span className="font-medium">{item.title}</span></div>
              <div className="text-xs text-muted-foreground">Submitted {new Date(item.submittedAtISO).toLocaleString()} {item.summary ? `• ${item.summary}` : ""}</div>
              <div className="text-xs space-x-2">
                {item.slug ? <Link className="underline" href={`/${item.entityType.toLowerCase()}s/${item.slug}`}>Public</Link> : null}
                <Link className="underline" href={`/admin/${item.entityType.toLowerCase()}s/${item.entityId}`}>Edit</Link>
              </div>
            </div>
            <Button onClick={() => setActive(item)}>Review</Button>
          </div>
        ))}
      </div>

      {active ? (
        <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-background p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Review {active.entityType}</h3><Button variant="outline" onClick={() => setActive(null)}>Close</Button></div>
          {error ? <InlineBanner>{error}</InlineBanner> : null}
          <p className="text-sm font-medium">{active.title}</p>
          <p className="text-xs text-muted-foreground">Submission ID: {active.submissionId}</p>
          <textarea className="w-full rounded border p-2 text-sm" rows={5} placeholder="Feedback for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={() => decide("approve")}>Approve</Button>
            <Button variant="outline" onClick={() => decide("reject")}>Reject</Button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
