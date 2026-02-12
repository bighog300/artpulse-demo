"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/app/my/_components/ImageUploader";

type VenueRecord = {
  id: string;
  name: string;
  description: string | null;
  addressLine1: string | null;
  city: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  featuredImageUrl: string | null;
  featuredAssetId: string | null;
  featuredAsset?: { url: string } | null;
  lat: number | null;
  lng: number | null;
  isPublished: boolean;
};

export default function VenueSelfServeForm({ venue, submissionStatus }: { venue: VenueRecord; submissionStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>({ ...venue, submitForApproval: false, note: "" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/my/venues/${venue.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error?.message || "Failed to save venue");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
      <label className="block"><span className="text-sm">Name</span><input className="border rounded p-2 w-full" value={String(form.name ?? "")} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">Description</span><textarea className="border rounded p-2 w-full" value={String(form.description ?? "")} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">Address</span><input className="border rounded p-2 w-full" value={String(form.addressLine1 ?? "")} onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">City</span><input className="border rounded p-2 w-full" value={String(form.city ?? "")} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">Website</span><input className="border rounded p-2 w-full" value={String(form.websiteUrl ?? "")} onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">Instagram</span><input className="border rounded p-2 w-full" value={String(form.instagramUrl ?? "")} onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))} /></label>
      <label className="block"><span className="text-sm">Featured image URL (legacy)</span><input className="border rounded p-2 w-full" value={String(form.featuredImageUrl ?? "")} onChange={(e) => setForm((p) => ({ ...p, featuredImageUrl: e.target.value || null }))} /></label>
      <ImageUploader
        label="Upload featured image"
        initialUrl={venue.featuredAsset?.url ?? venue.featuredImageUrl}
        onUploaded={({ assetId, url }) => setForm((p) => ({ ...p, featuredAssetId: assetId, featuredImageUrl: url }))}
      />
      {!venue.isPublished ? <label className="block text-sm"><input type="checkbox" className="mr-2" checked={Boolean(form.submitForApproval)} onChange={(e) => setForm((p) => ({ ...p, submitForApproval: e.target.checked }))} />{submissionStatus === "REJECTED" ? "Resubmit venue for approval" : "Submit venue for approval"}</label> : null}
      <label className="block"><span className="text-sm">Submission note</span><textarea className="border rounded p-2 w-full" value={String(form.note ?? "")} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} /></label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="rounded border px-3 py-1">Save venue</button>
    </form>
  );
}
