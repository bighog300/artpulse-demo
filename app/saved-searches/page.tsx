import { getSessionUser } from "@/lib/auth";
import { SavedSearchesClient } from "@/components/saved-searches/saved-searches-client";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function SavedSearchesPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Saved Searches</h1>
      <SavedSearchesClient />
    </main>
  );
}
