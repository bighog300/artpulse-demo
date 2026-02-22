"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CreateVenuePayload = {
  name: string;
  city?: string;
  country?: string;
  websiteUrl?: string;
};

type Props = { buttonLabel?: string };

export function CreateVenueForm({ buttonLabel = "Create venue" }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CreateVenuePayload>({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch("/api/my/venues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body?.error?.message ?? "Failed to create venue");
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    router.push(`/my/venues/${body.venue.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded border p-4">
      <label className="block">
        <span className="text-sm">Venue name</span>
        <input
          className="w-full rounded border p-2"
          required
          minLength={2}
          maxLength={80}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label className="block">
        <span className="text-sm">City (optional)</span>
        <input
          className="w-full rounded border p-2"
          maxLength={80}
          value={form.city ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value || undefined }))}
        />
      </label>
      <label className="block">
        <span className="text-sm">Country (optional)</span>
        <input
          className="w-full rounded border p-2"
          maxLength={80}
          value={form.country ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value || undefined }))}
        />
      </label>
      <label className="block">
        <span className="text-sm">Website (optional)</span>
        <input
          className="w-full rounded border p-2"
          type="url"
          value={form.websiteUrl ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, websiteUrl: event.target.value || undefined }))}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : buttonLabel}</Button>
    </form>
  );
}
