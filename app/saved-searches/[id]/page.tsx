import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SavedSearchRunner } from "@/components/saved-searches/saved-search-runner";
import { redirectToLogin } from "@/lib/auth-redirect";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function SavedSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");
  const routeParams = await params;
  const saved = await db.savedSearch.findFirst({ where: { id: routeParams.id, userId: user.id } });
  if (!saved) {
    return <main className="p-6">Saved search not found.</main>;
  }

  return (
    <main className="space-y-4 p-6">
      <Breadcrumbs items={[{ label: "Saved Searches", href: "/saved-searches" }, { label: saved.name, href: `/saved-searches/${saved.id}` }]} />
      <h1 className="text-2xl font-semibold">{saved.name}</h1>
      <p className="text-sm text-gray-600">{saved.type} · {saved.frequency} · {saved.isEnabled ? "Enabled" : "Disabled"}</p>
      <SavedSearchRunner id={saved.id} />
    </main>
  );
}
