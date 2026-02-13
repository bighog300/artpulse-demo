import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SavedSearchesClient } from "@/components/saved-searches/saved-searches-client";

export default async function SavedSearchesPage() {
  const user = await getSessionUser();
  if (!user) {
    return <main className="p-6">Please <Link className="underline" href="/login">login</Link>.</main>;
  }
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Saved Searches</h1>
      <SavedSearchesClient />
    </main>
  );
}
