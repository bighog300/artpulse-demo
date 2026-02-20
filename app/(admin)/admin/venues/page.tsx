import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminVenues() {
  const items = await db.venue.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Manage Venues</h1>
      <Link className="underline" href="/admin/venues/new">New Venue</Link>
      <ul>
        {items.map((v) => (
          <li key={v.id}><Link className="underline" href={`/admin/venues/${v.id}`}>{v.name}</Link></li>
        ))}
      </ul>
    </main>
  );
}
