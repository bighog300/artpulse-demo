import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function ArtistsPage() {
  const items = await db.artist.findMany({ where: { isPublished: true }, orderBy: { name: "asc" } });
  return <main className="p-6"><h1 className="text-2xl font-semibold mb-4">Artists</h1><ul className="space-y-2">{items?.map((a: { id: string; name?: string; slug?: string; updatedAt?: Date }) => <li key={a.id}><Link className="underline" href={`/artists/${a.slug}`}>{a.name}</Link></li>)}</ul></main>;
}
