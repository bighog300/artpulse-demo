import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { ForYouClient } from "@/components/recommendations/for-you-client";

export default async function ForYouPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/for-you");

  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">For You</h1>
        <p>Set DATABASE_URL to view personalized recommendations locally.</p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">For You</h1>
      <ForYouClient />
    </main>
  );
}
