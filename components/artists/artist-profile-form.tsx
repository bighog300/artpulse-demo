"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";
import { enqueueToast } from "@/lib/toast";

type ArtistProfile = {
  name: string;
  bio: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  avatarImageUrl: string | null;
};

export function ArtistProfileForm({ initialProfile }: { initialProfile: ArtistProfile }) {
  const router = useRouter();
  const [form, setForm] = useState<ArtistProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/my/artist", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        window.location.href = buildLoginRedirectUrl("/my/artist");
        return;
      }
      if (!res.ok) {
        enqueueToast({ title: "Failed to update artist profile", variant: "error" });
        return;
      }

      enqueueToast({ title: "Profile saved", variant: "success" });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <label className="block">
        <span className="text-sm">Artist name</span>
        <input className="w-full rounded border px-2 py-1" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-sm">Statement / bio</span>
        <textarea className="w-full rounded border px-2 py-1" rows={4} value={form.bio ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value || null }))} />
      </label>
      <label className="block">
        <span className="text-sm">Website URL</span>
        <input className="w-full rounded border px-2 py-1" value={form.websiteUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value || null }))} />
      </label>
      <label className="block">
        <span className="text-sm">Instagram URL</span>
        <input className="w-full rounded border px-2 py-1" value={form.instagramUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, instagramUrl: e.target.value || null }))} />
      </label>
      <button className="rounded border px-3 py-1" disabled={isSaving}>{isSaving ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
