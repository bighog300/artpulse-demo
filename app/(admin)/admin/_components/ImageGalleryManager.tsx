"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminImageUpload from "@/app/(admin)/admin/_components/AdminImageUpload";
import { enqueueToast } from "@/lib/toast";

type EntityType = "event" | "venue" | "artist";
type GalleryItem = { id: string; url: string; alt: string | null; sortOrder: number; isPrimary: boolean };

type Props = {
  entityType: EntityType;
  entityId: string;
  initialItems?: GalleryItem[];
};

export default function ImageGalleryManager({ entityType, entityId, initialItems }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const altTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const basePath = useMemo(() => `/api/admin/${entityType}s/${entityId}/images`, [entityType, entityId]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const res = await fetch(basePath, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? "Failed to load gallery");
    } else {
      setError(null);
      setItems((body.items ?? []) as GalleryItem[]);
    }
    setLoading(false);
  }, [basePath]);

  useEffect(() => {
    if (initialItems) return;
    void fetchImages();
  }, [fetchImages, initialItems]);

  async function addImage(url: string) {
    const res = await fetch(basePath, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? "Failed to add image");
      return;
    }
    setItems((prev) => [...prev, body.item as GalleryItem].sort((a, b) => a.sortOrder - b.sortOrder));
    enqueueToast({ title: "Image added" });
  }

  async function replaceImage(id: string, url: string) {
    const prev = items;
    setBusyId(id);
    setItems((curr) => curr.map((item) => (item.id === id ? { ...item, url } : item)));
    const res = await fetch(`${basePath}/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setItems(prev);
      setError(body?.error?.message ?? "Failed to replace image");
      enqueueToast({ title: "Failed to replace image", variant: "error" });
    } else {
      setItems((curr) => curr.map((item) => (item.id === id ? (body.item as GalleryItem) : item)));
      setReplaceId(null);
      enqueueToast({ title: "Image replaced" });
    }
    setBusyId(null);
  }

  async function setPrimary(id: string) {
    if (busyId) return;
    setBusyId(id);
    const prev = items;
    setItems((curr) => curr.map((item) => ({ ...item, isPrimary: item.id === id })));
    const res = await fetch(`${basePath}/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPrimary: true }) });
    if (!res.ok) setItems(prev);
    setBusyId(null);
  }

  async function removeImage(id: string) {
    if (busyId) return;
    setBusyId(id);
    const prev = items;
    setItems((curr) => curr.filter((item) => item.id !== id));
    const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
    if (!res.ok) setItems(prev);
    else enqueueToast({ title: "Image removed" });
    setBusyId(null);
  }

  async function reorder(nextOrder: string[]) {
    const prev = items;
    const nextItems = nextOrder.map((id, index) => ({ ...prev.find((item) => item.id === id)!, sortOrder: index }));
    setItems(nextItems);
    const res = await fetch(`${basePath}/reorder`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ order: nextOrder }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setItems(prev);
      if (res.status === 400 && body?.error?.code === "invalid_request") {
        enqueueToast({ title: "Gallery order changed remotely. Refreshing.", variant: "error" });
        await fetchImages();
        return;
      }
      enqueueToast({ title: "Failed to reorder images", variant: "error" });
      return;
    }
    enqueueToast({ title: "Order saved" });
  }

  function moveItem(id: string, direction: -1 | 1) {
    const idx = items.findIndex((item) => item.id === id);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[idx], ids[nextIdx]] = [ids[nextIdx]!, ids[idx]!];
    void reorder(ids);
  }

  function onAltInput(id: string, alt: string) {
    setItems((curr) => curr.map((item) => (item.id === id ? { ...item, alt } : item)));
    const existing = altTimersRef.current[id];
    if (existing) clearTimeout(existing);
    altTimersRef.current[id] = setTimeout(async () => {
      await fetch(`${basePath}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alt }),
      });
    }, 350);
  }

  const orderedItems = items.toSorted((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">Image gallery</h2>
      <AdminImageUpload targetType={entityType} targetId={entityId} role="gallery" multiple onUploaded={(url) => void addImage(url)} />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && items.length === 0 ? <p className="text-sm text-muted-foreground">No images yet.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orderedItems.map((item, index) => (
          <article
            key={item.id}
            className="space-y-2 rounded border p-2"
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragId || dragId === item.id) return;
              const ids = orderedItems.map((entry) => entry.id);
              const from = ids.indexOf(dragId);
              const to = ids.indexOf(item.id);
              if (from < 0 || to < 0) return;
              ids.splice(from, 1);
              ids.splice(to, 0, dragId);
              void reorder(ids);
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
          >
            <div className="relative h-36 w-full overflow-hidden rounded bg-muted">
              <Image src={item.url} alt={item.alt ?? "Gallery image"} fill className="object-cover" unoptimized />
              {item.isPrimary ? <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Featured</span> : null}
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => void setPrimary(item.id)} disabled={busyId === item.id || item.isPrimary}>Set featured</button>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => void removeImage(item.id)} disabled={busyId === item.id}>Remove</button>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setReplaceId((curr) => (curr === item.id ? null : item.id))} disabled={busyId === item.id}>Replace</button>
            </div>
            {replaceId === item.id ? (
              <AdminImageUpload
                targetType={entityType}
                targetId={entityId}
                role="gallery"
                mode="standalone"
                title="Upload replacement"
                onUploaded={(url) => void replaceImage(item.id, url)}
              />
            ) : null}
            <div className="flex gap-2">
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveItem(item.id, -1)} disabled={index === 0}>Up</button>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveItem(item.id, 1)} disabled={index === items.length - 1}>Down</button>
            </div>
            <input className="w-full rounded border px-2 py-1 text-xs" placeholder="Alt text" value={item.alt ?? ""} onChange={(event) => onAltInput(item.id, event.target.value)} />
          </article>
        ))}
      </div>
    </section>
  );
}
