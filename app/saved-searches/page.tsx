import { getSessionUser } from "@/lib/auth";
import { SavedSearchesClient } from "@/components/saved-searches/saved-searches-client";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export default async function SavedSearchesPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Saved Searches</h1>
        <p>Set DATABASE_URL to manage saved searches locally.</p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Saved Searches</h1>
      <SavedSearchesClient />
    </main>
  );
}
