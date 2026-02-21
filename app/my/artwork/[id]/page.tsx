"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Artwork = { id: string; title: string; slug: string | null; description: string | null; year: number | null; medium: string | null; dimensions: string | null; priceAmount: number | null; currency: string | null; isPublished: boolean; images: Array<{ id: string; alt: string | null; asset: { url: string } }>; };

export default function MyArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null>(null);

  useEffect(() => { void fetch(`/api/my/artwork/${id}`).then((res) => res.json()).then((data) => setArtwork(data.artwork)); }, [id]);
  if (!artwork) return <main className="p-6">Loading...</main>;

  return <main className="space-y-4 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Edit Artwork</h1><Link href="/my/artwork/new" className="rounded-md border px-3 py-1 text-sm">Add artwork</Link></div><input className="w-full rounded border px-2 py-1" value={artwork.title} onChange={(e) => setArtwork({ ...artwork, title: e.target.value })} /><input className="w-full rounded border px-2 py-1" value={artwork.slug ?? ""} onChange={(e) => setArtwork({ ...artwork, slug: e.target.value || null })} placeholder="slug (optional)" /><textarea className="w-full rounded border px-2 py-1" value={artwork.description ?? ""} onChange={(e) => setArtwork({ ...artwork, description: e.target.value })} /><div className="flex gap-2"><button className="rounded border px-2 py-1" onClick={async () => { await fetch(`/api/my/artwork/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: artwork.title, slug: artwork.slug, description: artwork.description }) }); }}>Save</button><button className="rounded border px-2 py-1" onClick={async () => { const isPublished = !artwork.isPublished; await fetch(`/api/my/artwork/${id}/publish`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublished }) }); setArtwork({ ...artwork, isPublished }); }}>{artwork.isPublished ? "Unpublish" : "Publish"}</button></div><h2 className="font-semibold">Images</h2><input type="file" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const form = new FormData(); form.append("file", file); const uploadRes = await fetch("/api/uploads/image", { method: "POST", body: form }); const uploaded = await uploadRes.json(); await fetch(`/api/my/artwork/${id}/images`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetId: uploaded.assetId }) }); const refreshed = await fetch(`/api/my/artwork/${id}`).then((res) => res.json()); setArtwork(refreshed.artwork); }} />
  <div className="grid grid-cols-2 gap-2">{artwork.images.map((image) => <img key={image.id} src={image.asset.url} alt={image.alt ?? "Artwork image"} className="h-28 w-full rounded border object-cover" />)}</div></main>;
}
