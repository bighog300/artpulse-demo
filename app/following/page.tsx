import Link from "next/link";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { getFollowingFeedWithDeps, type FollowingFeedTypeFilter } from "@/lib/following-feed";
import { getFollowRecommendations } from "@/lib/recommendations-follows";
import { FollowButton } from "@/components/follows/follow-button";
import { redirectToLogin } from "@/lib/auth-redirect";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { setOnboardingFlag } from "@/lib/onboarding";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { GetStartedBanner } from "@/components/onboarding/get-started-banner";
import { PersonalSection } from "@/components/personal/personal-section";
import { PersonalEventFeed } from "@/components/personal/personal-event-feed";
import { FollowedEntitiesGrid } from "@/components/personal/followed-entities-grid";
import { EmptyState } from "@/components/ui/empty-state";

type SearchParams = Promise<{ days?: string; type?: string }>;

export const dynamic = "force-dynamic";

export default async function FollowingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth().catch(() => redirectToLogin("/following"));

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="space-y-4">
        <PageHeader title="Following" subtitle="Updates from artists and venues you follow" actions={<Link href="/following/manage" className="rounded border px-3 py-1 text-sm">Manage</Link>} />
        <EmptyState title="Following feed unavailable" description="Set DATABASE_URL to load personalized following updates in local development." actions={[{ label: "Manage follows", href: "/following/manage", variant: "secondary" }]} />
      </PageShell>
    );
  }

  const params = await searchParams;
  const days: 7 | 30 = params.days === "30" ? 30 : 7;
  const type: FollowingFeedTypeFilter = params.type === "artist" || params.type === "venue" ? params.type : "both";

  const [result, followCount, recommendations] = await Promise.all([
    getFollowingFeedWithDeps(
      {
        now: () => new Date(),
        findFollows: async (userId) => db.follow.findMany({ where: { userId }, select: { targetType: true, targetId: true } }),
        findEvents: async ({ artistIds, venueIds, from, to, limit }) => db.event.findMany({
          where: {
            isPublished: true,
            startAt: { gte: from, lte: to },
            AND: [{
              OR: [
                ...(venueIds.length ? [{ venueId: { in: venueIds } }] : []),
                ...(artistIds.length ? [{ eventArtists: { some: { artistId: { in: artistIds } } } }] : []),
              ],
            }],
          },
          take: limit,
          orderBy: [{ startAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            startAt: true,
            endAt: true,
            venue: { select: { name: true, slug: true } },
          },
        }),
      },
      { userId: user.id, days, type, limit: 50 },
    ),
    db.follow.count({ where: { userId: user.id } }),
    getFollowRecommendations({ userId: user.id, limit: 6 }),
    setOnboardingFlag(user.id, "hasVisitedFollowing"),
  ]);

  const hasNoFollows = followCount === 0;

  return (
    <PageShell className="space-y-4">
      <PageHeader title="Following" subtitle="Updates from artists and venues you follow" actions={<Link href="/following/manage" className="rounded border px-3 py-1 text-sm">Manage</Link>} />
      <OnboardingPanel />
      <GetStartedBanner />

      <PersonalSection title="Your feed" description="Upcoming events from your followed artists and venues.">
        <PersonalEventFeed items={result.items} selectedDays={String(days) as "7" | "30"} selectedType={type} hasNoFollows={hasNoFollows} />
      </PersonalSection>

      <PersonalSection title="Followed artists & venues" description="Search and manage everyone you follow." actions={<Link className="text-sm underline" href="/following/manage">Advanced manage</Link>}>
        <FollowedEntitiesGrid />
      </PersonalSection>

      {(recommendations.artists.length || recommendations.venues.length) ? (
        <PersonalSection title="Suggested for you" description="Based on what you follow.">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...recommendations.artists.map((item) => ({ ...item, targetType: "ARTIST" as const })), ...recommendations.venues.map((item) => ({ ...item, targetType: "VENUE" as const }))].slice(0, 6).map((item) => {
              const href = item.targetType === "ARTIST" ? `/artists/${item.slug}` : `/venues/${item.slug}`;
              return (
                <li key={`${item.targetType}:${item.id}`} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <Link href={href} className="font-medium underline">{item.name}</Link>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <FollowButton targetId={item.id} targetType={item.targetType} initialIsFollowing={false} initialFollowersCount={0} isAuthenticated />
                </li>
              );
            })}
          </ul>
        </PersonalSection>
      ) : null}
    </PageShell>
  );
}
