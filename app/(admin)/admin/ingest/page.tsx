import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/app/(admin)/admin/_components/AdminPageHeader";
import IngestStatusBadge from "@/app/(admin)/admin/ingest/_components/ingest-status-badge";
import IngestTriggerClient from "@/app/(admin)/admin/ingest/_components/ingest-trigger-client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type IngestRun = {
  id: string;
  createdAt: Date;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  sourceUrl: string;
  fetchStatus: number | null;
  errorCode: string | null;
  createdCandidates: number;
  venue: { id: string; name: string };
};

export default async function AdminIngestPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const [runs, venues]: [IngestRun[], { id: string; name: string; websiteUrl: string | null }[]] = await Promise.all([
    db.ingestRun.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      select: {
        id: true,
        createdAt: true,
        status: true,
        sourceUrl: true,
        fetchStatus: true,
        errorCode: true,
        createdCandidates: true,
        venue: { select: { id: true, name: true } },
      },
    }),
    db.venue.findMany({
      where: { websiteUrl: { not: null }, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, websiteUrl: true },
      take: 200,
    }),
  ]);

  const venueOptions = venues.map((venue) => ({ id: venue.id, name: venue.name, websiteUrl: venue.websiteUrl ?? "" }));

  return (
    <main className="space-y-4">
      <AdminPageHeader
        title="Ingest"
        description="Run venue extraction and moderate extracted event candidates."
      />

      <div className="flex items-center justify-between">
        <IngestTriggerClient venues={venueOptions} />
        <div className="flex items-center gap-3">
          <Link href="/admin/ingest/health" className="text-sm underline">View Ingest Health</Link>
          <Link href="/admin/ingest/events" className="text-sm underline">View Event Queue</Link>
        </div>
      </div>

      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Recent Runs</h2>
          <p className="text-sm text-muted-foreground">Latest 20 ingest runs across venues.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2">Created At</th>
                <th className="px-3 py-2">Venue Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source URL</th>
                <th className="px-3 py-2">Created Count</th>
                <th className="px-3 py-2">Error Code</th>
                <th className="px-3 py-2">View</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b align-top">
                  <td className="px-3 py-2">{new Date(run.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{run.venue.name}</td>
                  <td className="px-3 py-2"><IngestStatusBadge status={run.status} /></td>
                  <td className="px-3 py-2 break-all text-xs text-muted-foreground">{run.sourceUrl}</td>
                  <td className="px-3 py-2">{run.createdCandidates ?? "—"}</td>
                  <td className="px-3 py-2">{run.status === "FAILED" ? run.errorCode ?? "FAILED" : "—"}</td>
                  <td className="px-3 py-2"><Link className="underline" href={`/admin/ingest/runs/${run.id}`}>Open</Link></td>
                </tr>
              ))}
              {runs.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-muted-foreground" colSpan={7}>No ingest runs found yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
