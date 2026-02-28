"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Run = {
  id: string;
  country: string;
  region: string;
  totalReturned: number;
  totalCreated: number;
  totalSkipped: number;
  createdAt: string | Date;
};

export function VenueGenerationClient({ initialRuns }: { initialRuns: Run[] }) {
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [runs, setRuns] = useState(initialRuns);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          setMessage(null);
          try {
            const response = await fetch("/api/admin/venue-generation", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ country, region }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body?.error?.message ?? "Generation failed");
            setMessage(`${body.totalCreated} venues created, ${body.totalSkipped} skipped.`);

            const runsRes = await fetch("/api/admin/venue-generation/runs", { cache: "no-store" });
            const runsBody = await runsRes.json();
            if (runsRes.ok && Array.isArray(runsBody?.runs)) setRuns(runsBody.runs);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" required />
        <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" required />
        <Button type="submit" disabled={loading}>{loading ? "Generating…" : "Generate Venues"}</Button>
      </form>

      <p className="text-xs text-muted-foreground">Typically 10–20 seconds per run.</p>
      {message ? <p className="rounded border border-emerald-300 bg-emerald-50 p-2 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">{error}</p> : null}

      <div className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent Runs</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Region</th><th>Returned</th><th>Created</th><th>Skipped</th><th>At</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t">
                <td className="py-2">{run.region}, {run.country}</td>
                <td>{run.totalReturned}</td>
                <td>{run.totalCreated}</td>
                <td>{run.totalSkipped}</td>
                <td>{new Date(run.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
