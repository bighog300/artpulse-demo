import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import AnalyticsAdminClient from "@/app/admin/analytics/analytics-admin-client";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminAnalyticsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Analytics"
        subtitle="Privacy-safe aggregated engagement metrics only (no user lists or raw streams)."
        actions={<Link className="underline text-sm" href="/admin">Back to Admin</Link>}
      />
      {hasDatabaseUrl() ? (
        <AnalyticsAdminClient />
      ) : (
        <p className="rounded border p-3 text-sm text-neutral-700">Set DATABASE_URL to view analytics.</p>
      )}
    </main>
  );
}
