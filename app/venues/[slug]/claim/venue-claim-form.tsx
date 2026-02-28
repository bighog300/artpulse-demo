"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClaimVenueForm({ slug }: { slug: string }) {
  const [roleAtVenue, setRoleAtVenue] = useState("Owner");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-lg border bg-background p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setStatus(null);
        try {
          const response = await fetch(`/api/venues/${encodeURIComponent(slug)}/claim`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleAtVenue, message }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body?.error?.message ?? "Failed to submit claim");
          setStatus(body.delivery === "EMAIL" ? "Claim submitted. Check the verification email." : "Claim submitted for manual review.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to submit claim");
        }
      }}
    >
      <label className="block text-sm font-medium">Role at venue</label>
      <input className="w-full rounded-md border px-3 py-2 text-sm" value={roleAtVenue} onChange={(e) => setRoleAtVenue(e.target.value)} maxLength={80} required />
      <label className="block text-sm font-medium">Message (optional)</label>
      <textarea className="w-full rounded-md border px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={4} />
      <Button type="submit">Submit claim</Button>
      {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
