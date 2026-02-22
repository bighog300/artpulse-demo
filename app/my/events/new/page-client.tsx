"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NewEventAutoCreate({ defaultPayload }: { defaultPayload: Record<string, unknown> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function createDraft() {
    setError(null);
    const res = await fetch("/api/my/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(defaultPayload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? "Failed to create draft event");
      return;
    }

    router.replace(`/my/events/${body.event.id}`);
    router.refresh();
  }

  useEffect(() => {
    void createDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Create event</h1>
      <p className="text-sm text-muted-foreground">Preparing your draft event…</p>
      {error ? (
        <div className="space-y-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <Button onClick={() => void createDraft()}>Retry</Button>
        </div>
      ) : null}
    </section>
  );
}
