import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Artists</h1>
        <p>Set DATABASE_URL to view artists locally.</p>
      </main>
    );
  }

  const items = await db.artist.findMany({ where: { isPublished: true }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Artists</h1>
      {items.length === 0 ? <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No artists published yet.</p> : null}
      <ul className="space-y-2">
        {items.map((artist) => (
          <li key={artist.id}>
            <Link className="underline" href={`/artists/${artist.slug}`}>
              {artist.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
