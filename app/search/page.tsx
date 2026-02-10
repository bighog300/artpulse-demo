import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const { query } = await searchParams;

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-2 p-6">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const items = await db.event.findMany({
    where: { isPublished: true, ...(query ? { title: { contains: query, mode: "insensitive" } } : {}) },
    take: 50,
    orderBy: { startAt: "asc" },
  });

  return (
    <main className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <form>
        <input name="query" defaultValue={query} className="rounded border p-2" />
        <button className="ml-2 rounded border px-3 py-2">Go</button>
      </form>
      <ul>
        {items?.map((e: { id: string; title?: string; slug?: string }) => (
          <li key={e.id}>
            <Link className="underline" href={`/events/${e.slug}`}>
              {e.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
