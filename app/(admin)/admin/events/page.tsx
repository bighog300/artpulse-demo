import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function AdminEvents() {
  const items = await db.event.findMany({ orderBy: { createdAt: "desc" } });
  return <main className="p-6"><h1 className="text-2xl font-semibold mb-3">Manage Events</h1><Link className="underline" href="/admin/events/new">New Event</Link><ul>{items?.map((e: { id: string; title?: string; slug?: string; startAt?: string | Date }) => <li key={e.id}><Link className="underline" href={`/admin/events/${e.id}`}>{e.title}</Link></li>)}</ul></main>;
}
