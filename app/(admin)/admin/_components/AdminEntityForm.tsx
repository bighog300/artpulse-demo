"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminImageUpload from "@/app/(admin)/admin/_components/AdminImageUpload";
import { safeParseImagesJson } from "@/lib/images";

type Props = {
  title: string;
  endpoint: string;
  method: "POST" | "PATCH";
  initial: Record<string, unknown>;
  fields: Array<{ name: string; label: string; type?: string }>;
  redirectPath: string;
  uploadTargetType: "venue" | "artist";
  uploadTargetId: string;
  featuredFieldName?: string;
  galleryJsonFieldName?: string;
};

export default function AdminEntityForm({
  title,
  endpoint,
  method,
  initial,
  fields,
  redirectPath,
  uploadTargetType,
  uploadTargetId,
  featuredFieldName = "featuredImageUrl",
  galleryJsonFieldName,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setUploadedAsFeatured(url: string) {
    setForm((prev) => ({ ...prev, [featuredFieldName]: url }));
    setPendingUploadUrl(null);
  }

  function appendUploadedImage(url: string) {
    if (!galleryJsonFieldName) return;
    const parsed = safeParseImagesJson(form[galleryJsonFieldName]);
    const next = [...parsed, { url, sortOrder: parsed.length }];
    setForm((prev) => ({ ...prev, [galleryJsonFieldName]: JSON.stringify(next, null, 2) }));
    setPendingUploadUrl(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.message || "Save failed");
      return;
    }
    router.push(redirectPath);
    router.refresh();
  }

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <form onSubmit={onSubmit} className="space-y-2 max-w-2xl">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="text-sm">{field.label}</span>
            <input
              type={field.type || "text"}
              value={String(form[field.name] ?? "")}
              onChange={(ev) => setForm((prev) => ({ ...prev, [field.name]: ev.target.value }))}
              className="border p-2 rounded w-full"
            />
          </label>
        ))}
        <AdminImageUpload targetType={uploadTargetType} targetId={uploadTargetId} role="gallery" onUploaded={setPendingUploadUrl} />
        {pendingUploadUrl ? (
          <div className="flex gap-2 text-sm">
            <button type="button" className="rounded border px-2 py-1" onClick={() => setUploadedAsFeatured(pendingUploadUrl)}>Set as featured</button>
            {galleryJsonFieldName ? (
              <button type="button" className="rounded border px-2 py-1" onClick={() => appendUploadedImage(pendingUploadUrl)}>Add to gallery JSON</button>
            ) : null}
          </div>
        ) : null}
        <label className="block text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.isPublished)}
            onChange={(ev) => setForm((prev) => ({ ...prev, isPublished: ev.target.checked }))}
            className="mr-2"
          />
          Published
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="rounded border px-3 py-1">Save</button>
      </form>
    </main>
  );
}
