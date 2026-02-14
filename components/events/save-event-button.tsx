"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enqueueToast } from "@/lib/toast";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";

type SaveEventButtonProps = {
  eventId: string;
  initialSaved: boolean;
  nextUrl: string;
  isAuthenticated: boolean;
};

export function SaveEventButton({ eventId, initialSaved, nextUrl, isAuthenticated }: SaveEventButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, setIsPending] = useState(false);

  async function onToggle() {
    if (isPending) return;
    if (!isAuthenticated) {
      router.push(buildLoginRedirectUrl(nextUrl));
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setIsPending(true);

    try {
      const response = await fetch(`/api/events/by-id/${eventId}/save`, {
        method: nextSaved ? "POST" : "DELETE",
      });

      if (response.status === 401) {
        router.push(buildLoginRedirectUrl(nextUrl));
        setSaved(!nextSaved);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { code?: string } | string } | null;
        setSaved(!nextSaved);
        if (body?.error === "rate_limited" || body?.error && typeof body.error !== "string" && body.error.code === "rate_limited") {
          enqueueToast({ title: "Too many requests, try again", variant: "error" });
          return;
        }
        enqueueToast({ title: "Could not update saved event", variant: "error" });
        return;
      }

      enqueueToast({ title: nextSaved ? "Saved" : "Removed from saved" });
    } catch {
      setSaved(!nextSaved);
      enqueueToast({ title: "Could not update saved event", variant: "error" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className="inline-flex rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
      aria-pressed={saved}
      aria-busy={isPending}
    >
      {isPending ? "Saving..." : saved ? "Saved" : "Save"}
    </button>
  );
}
