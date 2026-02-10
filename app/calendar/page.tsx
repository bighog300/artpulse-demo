import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function CalendarPage() {
  const items = await db.event.findMany({ where: { isPublished: true }, orderBy: { startAt: "asc" }, take: 200 });
  return <main className="p-6"><h1 className="text-2xl font-semibold mb-4">Calendar (month/week/list)</h1><ul className="space-y-1">{items?.map((e: { id: string; title?: string; startAt?: string | Date }) => <li key={e.id}>{e.startAt ? new Date(e.startAt).toLocaleDateString() : ""} - {e.title}</li>)}</ul></main>;
}
