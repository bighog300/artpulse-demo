import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DigestsPage() {
  const user = await getSessionUser();
  if (!user) return <main className="p-6">Please <Link className="underline" href="/login">login</Link>.</main>;

  const items = await db.digestRun.findMany({
    where: { userId: user.id },
    include: { savedSearch: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Digest snapshots</h1>
      {items.length === 0 ? <p className="text-sm text-gray-600">No digests yet.</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded border p-3">
            <p className="font-medium">{item.savedSearch.name}</p>
            <p className="text-sm text-gray-600">{item.periodKey} · {item.itemCount} items</p>
            <Link className="text-sm underline" href={`/digests/${item.id}`}>Open digest</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
