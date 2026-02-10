import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Artists</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const items = await db.artist.findMany({ where: { isPublished: true }, orderBy: { name: "asc" } });

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Artists</h1>
      <ul className="space-y-2">
        {items?.map((a: { id: string; name?: string; slug?: string }) => (
          <li key={a.id}>
            <Link className="underline" href={`/artists/${a.slug}`}>
              {a.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
