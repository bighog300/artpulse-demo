import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminArtists() {
  const items = await db.artist.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Manage Artists</h1>
      <Link className="underline" href="/admin/artists/new">New Artist</Link>
      <ul>
        {items.map((a) => (
          <li key={a.id}><Link className="underline" href={`/admin/artists/${a.id}`}>{a.name}</Link></li>
        ))}
      </ul>
    </main>
  );
}
