import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorCard } from "@/components/ui/error-card";
import { GetStartedWizard } from "@/components/onboarding/get-started-wizard";

export default async function GetStartedPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/get-started");

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Get started"
        subtitle="Complete the core personalization steps to unlock better recommendations."
      />

      {!hasDatabaseUrl() ? (
        <section className="space-y-4">
          <ErrorCard
            title="Database setup required"
            message="DATABASE_URL is not configured. Complete local setup in README and your Vercel checklist to enable personalized onboarding state."
          />
          <div className="flex flex-wrap gap-2">
            <Link href="/venues" className="rounded border px-3 py-1 text-sm">Browse venues</Link>
            <Link href="/artists" className="rounded border px-3 py-1 text-sm">Browse artists</Link>
            <Link href="/search" className="rounded border px-3 py-1 text-sm">Search events</Link>
            <Link href="/for-you" className="rounded border px-3 py-1 text-sm">For You</Link>
          </div>
        </section>
      ) : <GetStartedWizard />}
    </main>
  );
}
