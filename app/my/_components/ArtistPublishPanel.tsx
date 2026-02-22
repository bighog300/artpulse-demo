"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";
import { enqueueToast } from "@/lib/toast";

type PublishIssue = { field: string; message: string };

type Props = {
  artistSlug: string;
  isPublished: boolean;
  submissionStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null;
  submittedAt: string | null;
  decisionReason: string | null;
  initialIssues: PublishIssue[];
};

export function ArtistPublishPanel(props: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<PublishIssue[]>(props.initialIssues);
  const [message, setMessage] = useState("");

  const statusLabel = props.isPublished || props.submissionStatus === "APPROVED"
    ? "Published"
    : props.submissionStatus === "SUBMITTED"
      ? "Pending review"
      : props.submissionStatus === "REJECTED"
        ? "Needs changes"
        : "Draft";

  async function onSubmit() {
    if (pending || props.submissionStatus === "SUBMITTED") return;
    setPending(true);
    setIssues([]);
    try {
      const res = await fetch("/api/my/artist/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message || undefined }),
      });
      if (res.status === 401) {
        window.location.href = buildLoginRedirectUrl("/my/artist");
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const returned = body?.blocking;
        if (Array.isArray(returned)) setIssues(returned.map((item: { id: string; label: string }) => ({ field: item.id, message: item.label })));
        enqueueToast({ title: body?.message || body?.error?.message || "Unable to submit for review", variant: "error" });
        return;
      }
      enqueueToast({ title: "Artist profile submitted for review", variant: "success" });
      setMessage("");
      router.refresh();
    } catch {
      enqueueToast({ title: "Unable to submit for review", variant: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-2 rounded border p-4">
      <h2 className="font-semibold">Publishing</h2>
      <p className="text-sm">Status: <span className="font-medium">{statusLabel}</span></p>
      {props.submittedAt ? <p className="text-sm">Submitted: {new Date(props.submittedAt).toLocaleString()}</p> : null}
      {props.submissionStatus === "REJECTED" && props.decisionReason ? <p className="text-sm text-amber-700">Reviewer feedback: {props.decisionReason}</p> : null}

      {statusLabel === "Published" ? <p className="text-sm text-emerald-700">Live now: <Link className="underline" href={`/artists/${props.artistSlug}`}>View public page</Link></p> : null}

      {(props.submissionStatus === null || props.submissionStatus === "DRAFT" || props.submissionStatus === "REJECTED") ? (
        <>
          {issues.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-amber-800">
              {issues.map((issue, idx) => <li key={`${issue.field}-${idx}`}>{issue.message}</li>)}
            </ul>
          ) : <p className="text-sm text-emerald-700">All required fields are complete.</p>}

          <label className="block text-sm">
            Message to reviewer (optional)
            <textarea className="mt-1 w-full rounded border p-2" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
          </label>

          <button className="rounded border px-3 py-1 disabled:opacity-60" onClick={onSubmit} disabled={pending || issues.length > 0}>
            {pending ? "Submitting…" : "Submit for review"}
          </button>
        </>
      ) : null}

      {props.submissionStatus === "SUBMITTED" ? <p className="text-sm text-neutral-600">Your request is pending review.</p> : null}
    </section>
  );
}
