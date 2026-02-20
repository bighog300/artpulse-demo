"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminImageUpload from "@/app/(admin)/admin/_components/AdminImageUpload";

type EventImage = { assetId?: string | null; url?: string | null; alt?: string | null; sortOrder: number };

type Props = {
  title: string;
  endpoint: string;
  method: "POST" | "PATCH";
  eventId?: string;
  initial: {
    title?: string;
    slug?: string;
    description?: string | null;
    timezone?: string;
    startAt?: string;
    endAt?: string;
    venueId?: string | null;
    tagSlugs?: string[];
    artistSlugs?: string[];
    images?: EventImage[];
    isPublished?: boolean;
  };
};

function parseImages(text: string) {
  return JSON.parse(text || "[]") as EventImage[];
}

export default function EventAdminForm({ title, endpoint, method, eventId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...initial });
  const [tagSlugsText, setTagSlugsText] = useState((initial.tagSlugs || []).join(","));
  const [artistSlugsText, setArtistSlugsText] = useState((initial.artistSlugs || []).join(","));
  const [imagesText, setImagesText] = useState(JSON.stringify(initial.images || [], null, 2));
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function appendUploadedImage(url: string) {
    try {
      const parsed = parseImages(imagesText);
      const next = [...parsed, { url, alt: "", sortOrder: parsed.length }];
      setImagesText(JSON.stringify(next, null, 2));
      setPendingUploadUrl(null);
    } catch {
      setError("Images JSON must be valid before appending upload URL");
    }
  }

  function setUploadedAsFeatured(url: string) {
    try {
      const parsed = parseImages(imagesText).filter((image) => image.url !== url);
      const next = [{ url, alt: "", sortOrder: 0 }, ...parsed].map((image, index) => ({ ...image, sortOrder: index }));
      setImagesText(JSON.stringify(next, null, 2));
      setPendingUploadUrl(null);
    } catch {
      setError("Images JSON must be valid before setting featured image");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let images: EventImage[] = [];
    try {
      images = parseImages(imagesText);
    } catch {
      setError("Images must be valid JSON array");
      return;
    }

    const payload = {
      ...form,
      tagSlugs: tagSlugsText.split(",").map((x) => x.trim()).filter(Boolean),
      artistSlugs: artistSlugsText.split(",").map((x) => x.trim()).filter(Boolean),
      images,
    };

    const res = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.message || "Save failed");
      return;
    }
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <form onSubmit={onSubmit} className="space-y-2 max-w-2xl">
        {[
          ["title", "Title"],
          ["slug", "Slug"],
          ["timezone", "Timezone"],
          ["startAt", "Start (ISO 8601)", "datetime-local"],
          ["endAt", "End (ISO 8601)", "datetime-local"],
          ["venueId", "Venue ID"],
        ].map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="text-sm">{label}</span>
            <input className="border p-2 rounded w-full" type={type || "text"} value={String(form[key as keyof typeof form] ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value || null }))} />
          </label>
        ))}
        <AdminImageUpload targetType="event" targetId={eventId ?? "new"} role="gallery" onUploaded={(url) => setPendingUploadUrl(url)} />
        {pendingUploadUrl ? (
          <div className="flex gap-2 text-sm">
            <button type="button" className="rounded border px-2 py-1" onClick={() => setUploadedAsFeatured(pendingUploadUrl)}>Set as featured</button>
            <button type="button" className="rounded border px-2 py-1" onClick={() => appendUploadedImage(pendingUploadUrl)}>Add to gallery JSON</button>
          </div>
        ) : null}
        <label className="block">
          <span className="text-sm">Description</span>
          <textarea className="border p-2 rounded w-full" value={String(form.description ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value || null }))} />
        </label>
        <label className="block">
          <span className="text-sm">Tag slugs (comma-separated)</span>
          <input className="border p-2 rounded w-full" value={tagSlugsText} onChange={(e) => setTagSlugsText(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Artist slugs (comma-separated)</span>
          <input className="border p-2 rounded w-full" value={artistSlugsText} onChange={(e) => setArtistSlugsText(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Event images JSON array</span>
          <textarea className="border p-2 rounded w-full min-h-28 font-mono text-xs" value={imagesText} onChange={(e) => setImagesText(e.target.value)} />
        </label>
        <label className="block text-sm"><input type="checkbox" className="mr-2" checked={Boolean(form.isPublished)} onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))} />Published</label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="rounded border px-3 py-1">Save</button>
      </form>
    </main>
  );
}
