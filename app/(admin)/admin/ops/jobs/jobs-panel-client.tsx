"use client";

import { useMemo, useState } from "react";

type JobRun = {
  id: string;
  createdAt: string;
  name: string;
  status: string;
  trigger: string;
  actorEmail: string | null;
  message: string | null;
};

type JobMeta = {
  name: string;
  description: string;
};

export function JobsPanelClient({ initialRuns, jobs }: { initialRuns: JobRun[]; jobs: JobMeta[] }) {
  const [runs, setRuns] = useState<JobRun[]>(initialRuns);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobName, setJobName] = useState(jobs[0]?.name ?? "");
  const [params, setParams] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedJob = useMemo(() => jobs.find((job) => job.name === jobName), [jobName, jobs]);

  async function refreshRuns() {
    setBusy(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (nameFilter) query.set("name", nameFilter);
      if (statusFilter) query.set("status", statusFilter);
      const res = await fetch(`/api/admin/jobs/runs?${query.toString()}`, { method: "GET" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load runs");
      setRuns(body.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setBusy(true);
    setError(null);
    try {
      const parsedParams = params.trim() ? JSON.parse(params) : {};
      const res = await fetch("/api/admin/jobs/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: jobName, params: parsedParams }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to run job");
      await refreshRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run job");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded border bg-background p-3 space-y-2">
        <h2 className="text-lg font-medium">Run a job</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <select className="rounded border px-2 py-1 text-sm" value={jobName} onChange={(event) => setJobName(event.target.value)}>
            {jobs.map((job) => (
              <option key={job.name} value={job.name}>{job.name}</option>
            ))}
          </select>
          <input className="rounded border px-2 py-1 text-sm md:col-span-2" value={params} onChange={(event) => setParams(event.target.value)} placeholder='{"dryRun":true}' />
        </div>
        <p className="text-xs text-muted-foreground">{selectedJob?.description ?? "Select a job"}</p>
        <button type="button" disabled={busy || !jobName} className="rounded border px-3 py-1 text-sm" onClick={runNow}>Run now</button>
      </section>

      <section className="rounded border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent runs</h2>
          <button type="button" className="rounded border px-3 py-1 text-sm" disabled={busy} onClick={refreshRuns}>Refresh</button>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <input className="rounded border px-2 py-1 text-sm" placeholder="Filter by name" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} />
          <input className="rounded border px-2 py-1 text-sm" placeholder="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Trigger</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr><td className="px-3 py-3 text-muted-foreground" colSpan={6}>No runs found.</td></tr>
              ) : runs.map((run) => (
                <tr key={run.id} className="border-t">
                  <td className="px-3 py-2">{new Date(run.createdAt).toISOString()}</td>
                  <td className="px-3 py-2">{run.name}</td>
                  <td className="px-3 py-2">{run.status}</td>
                  <td className="px-3 py-2">{run.trigger}</td>
                  <td className="px-3 py-2">{run.actorEmail ?? "—"}</td>
                  <td className="px-3 py-2">{run.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
