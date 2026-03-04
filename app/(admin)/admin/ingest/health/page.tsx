import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/app/(admin)/admin/_components/AdminPageHeader";
import IngestStatusBadge from "@/app/(admin)/admin/ingest/_components/ingest-status-badge";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminIngestHealthData } from "@/lib/ingest/health-query";

export const dynamic = "force-dynamic";

export default async function AdminIngestHealthPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const data = await getAdminIngestHealthData(db);

  return (
    <main className="space-y-4">
      <AdminPageHeader title="Ingest Health" description="7-day ingestion reliability and volume guardrail signals." />
      <div><Link href="/admin/ingest" className="text-sm underline">Back to Ingest</Link></div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Runs (7d)</p><p className="text-2xl font-semibold">{data.last7Days.totalRuns}</p></div>
        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Success rate</p><p className="text-2xl font-semibold">{(data.last7Days.successRate * 100).toFixed(1)}%</p></div>
        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Avg created candidates</p><p className="text-2xl font-semibold">{data.last7Days.avgCreatedCandidates.toFixed(1)}</p></div>
        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Avg duration</p><p className="text-2xl font-semibold">{Math.round(data.last7Days.avgDurationMs)}ms</p></div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-base font-semibold">Circuit breaker</h2>
        <p className="text-sm">Status: <span className={data.circuitBreaker.open ? "text-amber-600" : "text-emerald-600"}>{data.circuitBreaker.open ? "OPEN" : "CLOSED"}</span></p>
        <p className="text-sm text-muted-foreground">Fail rate: {(data.circuitBreaker.failRate * 100).toFixed(1)}% ({data.circuitBreaker.runCount} runs)</p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-base font-semibold">Top error codes (7d)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {data.last7Days.topErrorCodes.map((row) => <li key={row.errorCode}>{row.errorCode}: {row.count}</li>)}
          {data.last7Days.topErrorCodes.length === 0 ? <li className="text-muted-foreground">No failures.</li> : null}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-base font-semibold">Runs in last 24h</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead><tr className="border-b text-left"><th className="px-3 py-2">Created</th><th className="px-3 py-2">Venue</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Deduped</th><th className="px-3 py-2">Error</th></tr></thead>
            <tbody>
              {data.last24hRuns.map((run) => (
                <tr key={run.id} className="border-b align-top">
                  <td className="px-3 py-2">{new Date(run.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{run.venueName ?? run.venueId}</td>
                  <td className="px-3 py-2"><IngestStatusBadge status={run.status} /></td>
                  <td className="px-3 py-2">{run.createdCandidates}</td>
                  <td className="px-3 py-2">{run.dedupedCandidates}</td>
                  <td className="px-3 py-2">{run.errorCode ?? "—"}</td>
                </tr>
              ))}
              {data.last24hRuns.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-muted-foreground">No runs in last 24h.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
