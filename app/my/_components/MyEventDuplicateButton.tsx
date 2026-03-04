"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";
import { enqueueToast } from "@/lib/toast";

type DuplicateEventParams = {
  eventId: string;
  fetchImpl?: typeof fetch;
};

type DuplicateEventResult =
  | { ok: true; eventId: string }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function duplicateEventRequest({ eventId, fetchImpl = fetch }: DuplicateEventParams): Promise<DuplicateEventResult> {
  const response = await fetchImpl(`/api/my/events/${eventId}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (response.ok) {
    const body = await response.json().catch(() => ({}));
    return typeof body?.eventId === "string" ? { ok: true, eventId: body.eventId } : { ok: false, status: 500, body: {} };
  }

  const body = await response.json().catch(() => ({}));
  return { ok: false, status: response.status, body };
}

export default function MyEventDuplicateButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function onDuplicate() {
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      const result = await duplicateEventRequest({ eventId });
      if (!result.ok) {
        if (result.status === 401) {
          enqueueToast({ title: "Please log in", variant: "error" });
          window.location.href = buildLoginRedirectUrl("/my/events");
          return;
        }
        enqueueToast({
          title: typeof result.body.message === "string" ? result.body.message : "Unable to duplicate event",
          variant: "error",
        });
        return;
      }

      enqueueToast({ title: "Draft duplicated", variant: "success" });
      router.push(`/my/events/${result.eventId}`);
    } catch {
      enqueueToast({ title: "Unable to duplicate event", variant: "error" });
    } finally {
      setIsDuplicating(false);
    }
  }

  return (
    <Button type="button" variant="link" className="h-auto p-0" onClick={onDuplicate} disabled={isDuplicating}>
      {isDuplicating ? "Duplicating…" : "Duplicate"}
    </Button>
  );
}
