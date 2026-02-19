import { ArtistsClient } from "@/app/artists/artists-client";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { uiFixtureArtists, useUiFixtures as getUiFixturesEnabled } from "@/lib/ui-fixtures";

export const dynamic = "force-dynamic";
const fixturesEnabled = getUiFixturesEnabled();

export default async function ArtistsPage() {
  const user = await getSessionUser();

  if (!hasDatabaseUrl() && !fixturesEnabled) {
    return (
      <PageShell className="space-y-4">
        <PageHeader title="Artists" subtitle="Discover artists and follow the creators you care about." />
        <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
      </PageShell>
    );
  }

  let artists: Array<{ id: string; name: string; slug: string; bio: string | null; avatarImageUrl: string | null; tags: string[]; followersCount: number; isFollowing: boolean }> = [];

  if (hasDatabaseUrl()) {
    const dbArtists = await db.artist.findMany({
      where: { isPublished: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatarImageUrl: true,
        eventArtists: { where: { event: { isPublished: true } }, take: 8, select: { event: { select: { eventTags: { select: { tag: { select: { slug: true } } } } } } } },
      },
    });
    const ids = dbArtists.map((artist) => artist.id);
    const [followerCounts, userFollows] = await Promise.all([
      ids.length ? db.follow.groupBy({ by: ["targetId"], where: { targetType: "ARTIST", targetId: { in: ids } }, _count: { _all: true } }) : Promise.resolve([]),
      user && ids.length ? db.follow.findMany({ where: { userId: user.id, targetType: "ARTIST", targetId: { in: ids } }, select: { targetId: true } }) : Promise.resolve([]),
    ]);
    const countById = new Map(followerCounts.map((entry) => [entry.targetId, entry._count._all]));
    const followedSet = new Set(userFollows.map((row) => row.targetId));
    artists = dbArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio,
      avatarImageUrl: artist.avatarImageUrl,
      tags: Array.from(new Set(artist.eventArtists.flatMap((row) => row.event.eventTags.map(({ tag }) => tag.slug)))).slice(0, 6),
      followersCount: countById.get(artist.id) ?? 0,
      isFollowing: followedSet.has(artist.id),
    }));
  } else {
    artists = uiFixtureArtists.map((artist) => ({ ...artist, tags: artist.tags ?? [], followersCount: 0, isFollowing: false }));
  }

  return (
    <PageShell className="space-y-4">
      <PageHeader title="Artists" subtitle="Discover artists and follow the creators you care about." />
      <ArtistsClient artists={artists} isAuthenticated={Boolean(user)} />
    </PageShell>
  );
}
