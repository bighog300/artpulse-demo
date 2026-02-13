import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

const publicTiles = [
  { title: "Browse events", description: "See what’s coming up across exhibitions, openings, and talks.", href: "/events" },
  { title: "Find nearby", description: "Discover events around your current city or map area.", href: "/nearby" },
  { title: "Search", description: "Filter by keyword, city, venue, artist, and date.", href: "/search" },
];

const authedTiles = [
  { title: "For You", description: "Personalized picks based on your follows and activity.", href: "/for-you" },
  { title: "Following", description: "A feed from venues and artists you follow.", href: "/following" },
  { title: "Notifications", description: "Track invites, updates, and submission changes.", href: "/notifications" },
  { title: "Saved Searches", description: "Manage saved searches and alerts.", href: "/saved-searches" },
  { title: "Create / Manage Venue", description: "Create venues, edit details, and submit events.", href: "/my/venues" },
];

export default async function Home() {
  const user = await getSessionUser();
  const tiles = user ? authedTiles : publicTiles;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Artpulse</h1>
        <p className="text-zinc-700">Discover art events and keep up with the scenes you care about.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="rounded-lg border bg-white p-5 transition hover:bg-zinc-50">
            <h2 className="text-lg font-semibold">{tile.title}</h2>
            <p className="mt-2 text-sm text-zinc-700">{tile.description}</p>
          </Link>
        ))}
      </section>

      {!user ? <Link className="inline-block rounded border px-4 py-2 text-sm" href="/login">Sign in</Link> : null}
    </main>
  );
}
