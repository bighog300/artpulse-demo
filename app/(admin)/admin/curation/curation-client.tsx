"use client";

import { useEffect, useState } from "react";

type Collection = { id: string; slug: string; title: string; description: string | null; isPublished: boolean; itemCount: number };
type Artwork = { id: string; title: string; artist: { name: string }; isPublished: boolean };

export function AdminCurationClient() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [artworkSearch, setArtworkSearch] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  async function loadCollections() {
    const res = await fetch(`/api/admin/curation/collections?query=${encodeURIComponent(search)}`);
    const body = await res.json();
    if (res.ok) setCollections(body.collections ?? []);
  }

  async function loadArtworks() {
    const res = await fetch(`/api/admin/artwork/search?query=${encodeURIComponent(artworkSearch)}`);
    const body = await res.json();
    if (res.ok) setArtworks(body.artworks ?? []);
  }

  async function loadItems(collectionId: string) {
    const res = await fetch(`/api/admin/curation/collections/${collectionId}/items`);
    const body = await res.json();
    if (res.ok) setItems((body.items ?? []).map((item: { id: string }) => item.id));
  }

  useEffect(() => { void loadCollections(); }, [search]);
  useEffect(() => { void loadArtworks(); }, [artworkSearch]);

  async function createCollection() {
    const title = window.prompt("Collection title");
    const slug = window.prompt("Collection slug (lowercase-hyphen)");
    if (!title || !slug) return;
    await fetch("/api/admin/curation/collections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, slug }) });
    await loadCollections();
  }

  async function saveItems() {
    if (!selected) return;
    await fetch(`/api/admin/curation/collections/${selected.id}/items`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ artworkIds: items }) });
    await loadCollections();
  }

  async function togglePublished(collection: Collection) {
    await fetch(`/api/admin/curation/collections/${collection.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublished: !collection.isPublished }) });
    await loadCollections();
  }

  return <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
    <section className="space-y-3 rounded border p-3">
      <div className="flex justify-between"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collections" className="rounded border px-2 py-1 text-sm" /><button onClick={() => void createCollection()} className="rounded border px-2 py-1 text-sm">New</button></div>
      <div className="space-y-1">
        {collections.map((collection) => <div key={collection.id} className={`rounded border p-2 ${selected?.id === collection.id ? "bg-muted" : ""}`}>
          <button className="text-left" onClick={() => { setSelected(collection); void loadItems(collection.id); }}>{collection.title} ({collection.itemCount})</button>
          <div><button className="text-xs underline" onClick={() => void togglePublished(collection)}>{collection.isPublished ? "Unpublish" : "Publish"}</button></div>
        </div>)}
      </div>
    </section>
    <section className="space-y-3 rounded border p-3">
      <h3 className="font-medium">{selected ? `Edit: ${selected.title}` : "Select a collection"}</h3>
      {selected ? <>
        <input value={artworkSearch} onChange={(e) => setArtworkSearch(e.target.value)} placeholder="Search artworks" className="w-full rounded border px-2 py-1 text-sm" />
        <div className="max-h-40 space-y-1 overflow-auto rounded border p-2">
          {artworks.map((artwork) => {
            const checked = items.includes(artwork.id);
            return <label key={artwork.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={() => setItems((current) => checked ? current.filter((id) => id !== artwork.id) : [...current, artwork.id])} />{artwork.title} · {artwork.artist.name}</label>;
          })}
        </div>
        <button className="rounded border px-2 py-1 text-sm" onClick={() => void saveItems()}>Save items</button>
      </> : null}
    </section>
  </div>;
}
