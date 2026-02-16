#!/usr/bin/env node

const baseUrl = (process.env.PERF_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const today = new Date();
const in30 = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
const fmt = (d) => d.toISOString().slice(0, 10);

const cases = [
  ["events_default", `/api/events?limit=24`],
  ["events_tags", `/api/events?tags=music,art`],
  ["events_query", `/api/events?query=jazz`],
  ["events_date_range", `/api/events?from=${fmt(today)}&to=${fmt(in30)}`],
  ["events_geo_radius", `/api/events?lat=40.7128&lng=-74.0060&radiusKm=25&limit=24`],
  ["trending_events", `/api/trending/events`],
  ["recommendations_events", `/api/recommendations/events`],
];

async function runCase(name, path) {
  const url = `${baseUrl}${path}`;
  const startedAt = performance.now();
  try {
    const res = await fetch(url, {
      headers: {
        ...(process.env.PERF_COOKIE ? { cookie: process.env.PERF_COOKIE } : {}),
      },
      cache: "no-store",
    });
    const durationMs = Number((performance.now() - startedAt).toFixed(1));

    if (res.status === 401 || res.status === 403) {
      return { name, path, status: res.status, durationMs, ok: false, skipped: true, note: "auth_required" };
    }

    return { name, path, status: res.status, durationMs, ok: res.ok, skipped: false, note: res.ok ? "ok" : "error" };
  } catch (error) {
    return { name, path, status: 0, durationMs: Number((performance.now() - startedAt).toFixed(1)), ok: false, skipped: false, note: String(error) };
  }
}

function summarize(rows) {
  const okRows = rows.filter((row) => row.ok);
  const avg = okRows.length ? Number((okRows.reduce((s, r) => s + r.durationMs, 0) / okRows.length).toFixed(1)) : null;
  const p95 = okRows.length
    ? okRows
      .map((r) => r.durationMs)
      .sort((a, b) => a - b)[Math.max(0, Math.ceil(okRows.length * 0.95) - 1)]
    : null;

  return { avgMs: avg, p95Ms: p95, okCount: okRows.length, totalCount: rows.length };
}

(async () => {
  console.log(`Running perf smoke against ${baseUrl}`);
  const rows = [];
  for (const [name, path] of cases) {
    // eslint-disable-next-line no-await-in-loop
    const row = await runCase(name, path);
    rows.push(row);
  }

  console.table(rows.map((r) => ({
    name: r.name,
    status: r.status,
    durationMs: r.durationMs,
    result: r.ok ? "ok" : (r.skipped ? "skipped" : "failed"),
    note: r.note,
  })));

  const summary = summarize(rows);
  console.log("Summary:", summary);

  const hardFailures = rows.filter((r) => !r.ok && !r.skipped);
  if (hardFailures.length > 0) process.exit(1);
})();
