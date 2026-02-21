"use client";

import { useEffect, useMemo, useState } from "react";

type EntityName = "venues" | "events" | "artists";

type RowResult = { rowIndex: number; status: string; errors?: string[]; targetId?: string; patch?: Record<string, unknown> };

export function AdminEntityManagerClient({ entity, fields, title, defaultMatchBy }: { entity: EntityName; fields: string[]; title: string; defaultMatchBy: "id" | "slug" | "name" }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ summary: Record<string, number>; rowResults: RowResult[]; sampleRows: string[][] } | null>(null);
  const [createMissing, setCreateMissing] = useState(false);
  const [matchBy, setMatchBy] = useState<"id" | "slug" | "name">(defaultMatchBy);

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  async function loadData(nextQuery = query, nextPage = page) {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (nextQuery.trim()) params.set("query", nextQuery.trim());
      const res = await fetch(`/api/admin/${entity}?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load");
      setItems(body.items ?? []);
      setTotal(body.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadData(query, page), 250);
    return () => clearTimeout(timer);
  }, [query, page]);

  function startEdit(item: Record<string, unknown>) {
    const id = String(item.id ?? "");
    setEditingId(id);
    setDrafts((current) => ({ ...current, [id]: Object.fromEntries(fields.map((field) => [field, item[field] == null ? "" : String(item[field])])) }));
  }

  async function saveEdit(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    const payload: Record<string, unknown> = {};
    for (const key of fields) {
      if (!(key in draft)) continue;
      if (key === "isPublished") payload[key] = draft[key] === "true";
      else payload[key] = draft[key] === "" ? null : draft[key];
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${entity}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Save failed");
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    const href = `/api/admin/${entity}/export?${params.toString()}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function suggestField(column: string) {
    const lowered = column.toLowerCase();
    return fields.find((field) => lowered.includes(field.toLowerCase()) || field.toLowerCase().includes(lowered)) ?? "__ignore";
  }

  async function onUpload(file: File) {
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    const [head = ""] = text.split(/\r?\n/, 1);
    const parsedHeaders = head.split(",").map((part) => part.trim()).filter(Boolean);
    setHeaders(parsedHeaders);
    setMapping(Object.fromEntries(parsedHeaders.map((column) => [column, suggestField(column)])));
    setPreview(null);
  }

  async function runPreview() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", new File([csvText], fileName ?? `${entity}.csv`, { type: "text/csv" }));
      form.set("mapping", JSON.stringify(mapping));
      form.set("options", JSON.stringify({ createMissing, matchBy, dryRun: true }));
      const res = await fetch(`/api/admin/${entity}/import/preview`, { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Preview failed");
      setPreview(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyImport() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", new File([csvText], fileName ?? `${entity}.csv`, { type: "text/csv" }));
      form.set("mapping", JSON.stringify(mapping));
      form.set("options", JSON.stringify({ createMissing, matchBy, dryRun: false }));
      const res = await fetch(`/api/admin/${entity}/import/apply`, { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Apply failed");
      setImportOpen(false);
      setPreview(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} className="rounded border px-2 py-1 text-sm" placeholder={`Search ${entity}`} />
        <button type="button" onClick={() => void exportCsv()} className="rounded border px-3 py-1 text-sm">Export CSV</button>
        <button type="button" onClick={() => setImportOpen((v) => !v)} className="rounded border px-3 py-1 text-sm">Import CSV</button>
      </div>

      {importOpen ? (
        <div className="space-y-2 rounded border p-3">
          <input type="file" accept=".csv,text/csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onUpload(file); }} />
          {headers.length > 0 ? (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                {headers.map((column) => (
                  <label key={column} className="flex items-center justify-between gap-2 text-sm">
                    <span>{column}</span>
                    <select value={mapping[column] ?? "__ignore"} onChange={(e) => setMapping((m) => ({ ...m, [column]: e.target.value }))} className="rounded border px-2 py-1">
                      <option value="__ignore">Ignore</option>
                      {fields.map((field) => <option key={field} value={field}>{field}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} /> Create missing</label>
                <select className="rounded border px-2 py-1" value={matchBy} onChange={(e) => setMatchBy(e.target.value as "id" | "slug" | "name") }>
                  <option value="id">matchBy=id</option>
                  <option value="slug">matchBy=slug</option>
                  <option value="name">matchBy=name</option>
                </select>
                <button type="button" className="rounded border px-3 py-1" onClick={() => void runPreview()}>Preview import</button>
              </div>
            </div>
          ) : null}
          {preview ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Summary: total {preview.summary.total}, valid {preview.summary.valid}, invalid {preview.summary.invalid}, update {preview.summary.willUpdate}, create {preview.summary.willCreate}, skipped {preview.summary.skipped}</p>
              <div className="max-h-64 overflow-auto rounded border">
                <table className="w-full text-xs">
                  <thead><tr><th className="px-2 py-1">Row</th><th className="px-2 py-1">Status</th><th className="px-2 py-1">Errors</th></tr></thead>
                  <tbody>{preview.rowResults.slice(0, 20).map((row) => <tr key={row.rowIndex} className="border-t"><td className="px-2 py-1">{row.rowIndex}</td><td className="px-2 py-1">{row.status}</td><td className="px-2 py-1">{row.errors?.join(", ") ?? ""}</td></tr>)}</tbody>
                </table>
              </div>
              <button type="button" onClick={() => void applyImport()} className="rounded border px-3 py-1 text-sm">Apply import</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded border bg-background">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50"><tr>{["id", ...fields, "actions"].map((field) => <th key={field} className="px-3 py-2 text-left">{field}</th>)}</tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td className="px-3 py-3 text-muted-foreground" colSpan={fields.length + 2}>{busy ? "Loading..." : "No records"}</td></tr> : items.map((item) => {
              const id = String(item.id ?? "");
              const isEditing = editingId === id;
              return (
                <tr key={id} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs">{id}</td>
                  {fields.map((field) => (
                    <td key={field} className="px-3 py-2">
                      {isEditing ? (
                        field === "isPublished"
                          ? <select className="rounded border px-2 py-1 text-xs" value={drafts[id]?.[field] ?? "false"} onChange={(e) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [field]: e.target.value } }))}><option value="true">true</option><option value="false">false</option></select>
                          : <input className="w-full rounded border px-2 py-1 text-xs" value={drafts[id]?.[field] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [field]: e.target.value } }))} />
                      ) : String(item[field] ?? "")}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {isEditing ? <button type="button" onClick={() => void saveEdit(id)} className="rounded border px-2 py-1 text-xs">Save</button> : <button type="button" onClick={() => startEdit(item)} className="rounded border px-2 py-1 text-xs">Edit</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="rounded border px-3 py-1 text-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="text-sm">Page {page} / {maxPage}</span>
        <button type="button" className="rounded border px-3 py-1 text-sm" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>Next</button>
      </div>
    </div>
  );
}
