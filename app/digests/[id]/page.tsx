import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth";
import { digestSnapshotItemsSchema } from "@/lib/digest";

async function disableSavedSearch(id: string) {
  "use server";
  const user = await requireAuth();
  await db.savedSearch.updateMany({ where: { id, userId: user.id }, data: { isEnabled: false } });
}

export default async function DigestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return <main className="p-6">Please <Link className="underline" href="/login">login</Link>.</main>;

  const routeParams = await params;
  const digest = await db.digestRun.findFirst({
    where: { id: routeParams.id, userId: user.id },
    include: { savedSearch: { select: { id: true, name: true } } },
  });
  if (!digest) return <main className="p-6">Digest not found.</main>;

  const items = digestSnapshotItemsSchema.parse(digest.itemsJson);

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{digest.savedSearch.name} · {digest.periodKey}</h1>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${digest.id}-${item.slug}`} className="rounded border p-3">
            <Link className="font-medium underline" href={`/events/${item.slug}`}>{item.title}</Link>
            <p className="text-sm text-gray-600">{new Date(item.startAt).toLocaleString()}{item.venueName ? ` · ${item.venueName}` : ""}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <form action={disableSavedSearch.bind(null, digest.savedSearch.id)}>
          <button type="submit" className="rounded border px-3 py-1 text-sm">Disable this saved search</button>
        </form>
        <Link className="text-sm underline" href={`/saved-searches/${digest.savedSearch.id}`}>Edit saved search</Link>
      </div>
    </main>
  );
}
