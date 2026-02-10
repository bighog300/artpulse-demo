import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function VenuesPage() {
  const items = await db.venue.findMany({ where: { isPublished: true }, orderBy: { name: "asc" } });
  return <main className="p-6"><h1 className="text-2xl font-semibold mb-4">Venues</h1><ul className="space-y-2">{items?.map((v: { id: string; name?: string; slug?: string; updatedAt?: Date }) => <li key={v.id}><Link className="underline" href={`/venues/${v.slug}`}>{v.name}</Link></li>)}</ul></main>;
}
