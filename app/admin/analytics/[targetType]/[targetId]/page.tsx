import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { adminAnalyticsDrilldownQuerySchema } from "@/lib/validators";
import { getDrilldown } from "@/lib/admin-analytics-drilldown";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";

type DrilldownPayload = {
  windowDays: number;
  targetType: "EVENT" | "VENUE" | "ARTIST";
  targetId: string;
  totals: { events: number; views: number; clicks: number; ctr: number };
  bySurface: Array<{ surface: string; views: number; clicks: number; ctr: number }>;
  byDay: Array<{ day: string; views: number; clicks: number }>;
  resolved: { label?: string; href?: string };
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function AdminAnalyticsDrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<{ targetType: string; targetId: string }>;
  searchParams: Promise<{ days?: string; metric?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader
          title="Analytics drilldown"
          subtitle="Detailed engagement metrics for a single target."
          actions={<Link className="underline text-sm" href="/admin/analytics">Back to analytics</Link>}
        />
        <p className="rounded border p-3 text-sm text-neutral-700">Set DATABASE_URL to view drilldown analytics.</p>
      </main>
    );
  }

  const route = await params;
  const query = await searchParams;
  const parsed = adminAnalyticsDrilldownQuerySchema.safeParse({
    days: query.days,
    metric: query.metric,
    targetType: route.targetType,
    targetId: decodeURIComponent(route.targetId),
  });

  if (!parsed.success) notFound();

  const payload = (await getDrilldown(parsed.data.days, parsed.data.targetType, parsed.data.targetId, db as never)) as DrilldownPayload;

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title={`Drilldown: ${payload.resolved.label ?? payload.targetId}`}
        subtitle={`${payload.targetType} · last ${payload.windowDays} days`}
        actions={
          <div className="flex gap-3 text-sm">
            <Link className="underline" href="/admin/analytics">Back to analytics</Link>
            {payload.resolved.href ? <Link className="underline" href={payload.resolved.href}>Open target page</Link> : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Events</p><p className="text-xl font-semibold">{payload.totals.events}</p></div>
        <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Views</p><p className="text-xl font-semibold">{payload.totals.views}</p></div>
        <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Clicks</p><p className="text-xl font-semibold">{payload.totals.clicks}</p></div>
        <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">CTR</p><p className="text-xl font-semibold">{formatPercent(payload.totals.ctr)}</p></div>
      </div>

      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">By surface</h2>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b"><th className="text-left py-2">Surface</th><th className="text-right">Views</th><th className="text-right">Clicks</th><th className="text-right">CTR</th></tr></thead>
          <tbody>
            {payload.bySurface.map((row) => (
              <tr key={row.surface} className="border-b last:border-b-0"><td className="py-2">{row.surface}</td><td className="text-right">{row.views}</td><td className="text-right">{row.clicks}</td><td className="text-right">{formatPercent(row.ctr)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">By day trend</h2>
        <div className="space-y-1 text-sm font-mono">
          {payload.byDay.map((row) => (
            <div key={row.day} className="grid grid-cols-[110px_1fr_1fr] gap-3 border-b last:border-b-0 py-1">
              <span>{row.day}</span>
              <span>views: {row.views}</span>
              <span>clicks: {row.clicks}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
