"use client";

import { useEffect, useMemo, useState } from "react";

type Collection = { id: string; slug: string; title: string; description: string | null; isPublished: boolean; itemCount: number };
type Artwork = { id: string; title: string; slug?: string | null; artist: { name: string }; isPublished: boolean };
type QaRow = { id: string; title: string; slug: string; isPublished: boolean; counts: { totalItems: number; unpublishedArtworks: number; missingCover: number; publishBlocked: number; duplicatesInOtherCollections: number } };
type PreviewItem = { artworkId: string; title: string; slug: string | null; isPublished: boolean; coverOk: boolean; completeness: { requiredOk: boolean; scorePct: number } };

export function AdminCurationClient() {
  const [tab, setTab] = useState<"collections" | "qa">("collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [artworkSearch, setArtworkSearch] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [qaRows, setQaRows] = useState<QaRow[]>([]);
  const [duplicates, setDuplicates] = useState<Array<{ artworkId: string; collections: Array<{ isPublished: boolean }> }>>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);

  async function loadCollections() {
    const res = await fetch(`/api/admin/curation/collections?query=${encodeURIComponent(search)}`);
    const body = await res.json();
    if (res.ok) setCollections(body.collections ?? []);
  }

  async function loadQa() {
    const res = await fetch("/api/admin/curation/qa");
    const body = await res.json();
    if (!res.ok) return;
    setQaRows(body.byCollection ?? []);
    setDuplicates(body.duplicates ?? []);
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

  async function loadPreview(collectionId: string) {
    const res = await fetch(`/api/admin/curation/collections/${collectionId}/preview`);
    const body = await res.json();
    if (res.ok) setPreviewItems(body.items ?? []);
  }

  useEffect(() => { void loadCollections(); }, [search]);
  useEffect(() => { void loadArtworks(); }, [artworkSearch]);
  useEffect(() => { if (tab === "qa") void loadQa(); }, [tab]);

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
    await loadQa();
  }

  async function togglePublished(collection: Collection) {
    await fetch(`/api/admin/curation/collections/${collection.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublished: !collection.isPublished }) });
    await loadCollections();
    await loadQa();
  }

  const duplicateWarningCount = useMemo(() => {
    const selectedInPublishedDupes = new Set(
      duplicates
        .filter((dup) => dup.collections.filter((collection) => collection.isPublished).length > 1)
        .map((dup) => dup.artworkId),
    );
    return items.filter((id) => selectedInPublishedDupes.has(id)).length;
  }, [duplicates, items]);

  return <div className="space-y-4">
    <div className="flex gap-2 border-b pb-2 text-sm">
      <button className={tab === "collections" ? "font-semibold underline" : "text-muted-foreground"} onClick={() => setTab("collections")}>Collections</button>
      <button className={tab === "qa" ? "font-semibold underline" : "text-muted-foreground"} onClick={() => setTab("qa")}>QA</button>
    </div>

    {tab === "collections" ? <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="space-y-3 rounded border p-3">
        <div className="flex justify-between gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collections" className="w-full rounded border px-2 py-1 text-sm" /><button onClick={() => void createCollection()} className="rounded border px-2 py-1 text-sm">New</button></div>
        <div className="space-y-1">
          {collections.map((collection) => <div key={collection.id} className={`rounded border p-2 ${selected?.id === collection.id ? "bg-muted" : ""}`}>
            <button className="text-left" onClick={() => { setSelected(collection); void loadItems(collection.id); }}>{collection.title} ({collection.itemCount})</button>
            <div className="flex gap-3 text-xs"><button className="underline" onClick={() => void togglePublished(collection)}>{collection.isPublished ? "Unpublish" : "Publish"}</button><button className="underline" onClick={() => void loadPreview(collection.id)}>Preview</button></div>
          </div>)}
        </div>
      </section>
      <section className="space-y-3 rounded border p-3">
        <h3 className="font-medium">{selected ? `Edit: ${selected.title}` : "Select a collection"}</h3>
        {selected ? <>
          {duplicateWarningCount > 0 ? <p className="rounded border border-amber-500 bg-amber-50 p-2 text-xs">{duplicateWarningCount} artworks are already featured in other published collections.</p> : null}
          <input value={artworkSearch} onChange={(e) => setArtworkSearch(e.target.value)} placeholder="Search artworks" className="w-full rounded border px-2 py-1 text-sm" />
          <div className="max-h-40 space-y-1 overflow-auto rounded border p-2">
            {artworks.map((artwork) => {
              const checked = items.includes(artwork.id);
              return <label key={artwork.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={() => setItems((current) => checked ? current.filter((id) => id !== artwork.id) : [...current, artwork.id])} />{artwork.title} · {artwork.artist.name}</label>;
            })}
          </div>
          <div className="flex gap-2">
            <button className="rounded border px-2 py-1 text-sm" onClick={() => void saveItems()}>Save items</button>
            <button className="rounded border px-2 py-1 text-sm" onClick={() => void loadPreview(selected.id)}>Preview collection</button>
          </div>
          {previewItems.length ? <div className="space-y-2 rounded border p-2 text-xs">
            {previewItems.map((item) => <div key={item.artworkId} className="flex items-center justify-between gap-2 border-b pb-1">
              <div>
                <p className="font-medium">{item.title}</p>
                <div className="flex gap-2 text-muted-foreground">
                  <span>{item.isPublished ? "Published" : "Unpublished"}</span>
                  <span>{item.coverOk ? "Cover OK" : "Missing cover"}</span>
                  <span>{item.completeness.requiredOk ? "Ready" : "Needs work"}</span>
                </div>
              </div>
              <a className="underline" href={item.slug ? `/artwork/${item.slug}` : `/artwork/${item.artworkId}`}>Open artwork</a>
            </div>)}
          </div> : null}
        </> : null}
      </section>
    </div> : <section className="space-y-3 rounded border p-3">
      <h3 className="font-medium">Rail health</h3>
      <div className="grid gap-2 sm:hidden">
        {qaRows.map((row) => <article key={row.id} className="rounded border p-2 text-sm">
          <p className="font-medium">{row.title}</p>
          <p>Published: {row.isPublished ? "Yes" : "No"}</p>
          <p>Total: {row.counts.totalItems} · Unpublished: {row.counts.unpublishedArtworks} · Missing cover: {row.counts.missingCover}</p>
          <p>Publish blocked: {row.counts.publishBlocked} · Duplicates: {row.counts.duplicatesInOtherCollections}</p>
          <div className="flex gap-2 text-xs"><button className="underline" onClick={() => setTab("collections")}>Open</button><button className="underline" onClick={() => { setTab("collections"); void loadPreview(row.id); }}>Preview</button></div>
        </article>)}
      </div>
      <div className="hidden overflow-auto sm:block">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Collection</th><th>Published</th><th>Total items</th><th>Unpublished</th><th>Missing cover</th><th>Publish blocked</th><th>Duplicates</th><th /></tr></thead>
          <tbody>
            {qaRows.map((row) => <tr key={row.id} className="border-t">
              <td>{row.title}</td><td>{row.isPublished ? "Yes" : "No"}</td><td>{row.counts.totalItems}</td><td>{row.counts.unpublishedArtworks}</td><td>{row.counts.missingCover}</td><td>{row.counts.publishBlocked}</td><td>{row.counts.duplicatesInOtherCollections}</td>
              <td className="space-x-2"><button className="underline" onClick={() => setTab("collections")}>Open</button><button className="underline" onClick={() => { setTab("collections"); void loadPreview(row.id); }}>Preview</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>}
  </div>;
}
