import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import AnalyticsAdminClient from "@/app/admin/analytics/analytics-admin-client";

export default async function AdminAnalyticsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  return (
    <main className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-neutral-600">Privacy-safe aggregated engagement metrics only (no user lists or raw streams).</p>
        <Link className="underline text-sm" href="/admin">Back to Admin</Link>
      </div>
      {hasDatabaseUrl() ? (
        <AnalyticsAdminClient />
      ) : (
        <p className="rounded border p-3 text-sm text-neutral-700">Set DATABASE_URL to view analytics.</p>
      )}
    </main>
  );
}
