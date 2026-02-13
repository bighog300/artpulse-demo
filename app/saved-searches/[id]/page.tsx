import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SavedSearchRunner } from "@/components/saved-searches/saved-search-runner";

export default async function SavedSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return <main className="p-6">Please <Link className="underline" href="/login">login</Link>.</main>;
  }
  const routeParams = await params;
  const saved = await db.savedSearch.findFirst({ where: { id: routeParams.id, userId: user.id } });
  if (!saved) {
    return <main className="p-6">Saved search not found.</main>;
  }

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{saved.name}</h1>
      <p className="text-sm text-gray-600">{saved.type} · {saved.frequency} · {saved.isEnabled ? "Enabled" : "Disabled"}</p>
      <SavedSearchRunner id={saved.id} />
    </main>
  );
}
