import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const revalidate = 30;

export default async function EventsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Events</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const items = await db.event.findMany({ where: { isPublished: true }, orderBy: { startAt: "asc" }, take: 100 });

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-semibold">Events</h1>
      <p className="mb-4 text-sm text-gray-700">Looking for something local? <Link className="underline" href="/nearby">Find events near you</Link>. Manage <Link className="underline" href="/saved-searches">saved searches</Link>.</p>
      <ul className="space-y-2">
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
