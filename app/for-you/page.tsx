import Link from "next/link";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FeedbackButtons } from "@/components/recommendations/feedback-buttons";
import { EmptyState } from "@/components/ui/empty-state";

type ForYouResponse = {
  windowDays: number;
  items: Array<{
    score: number;
    reasons: string[];
    event: {
      id: string;
      title: string;
      slug: string;
      startAt: string;
      venue: { name: string; slug: string; city: string | null } | null;
    };
  }>;
};

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

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const response = await fetch(`${protocol}://${host}/api/recommendations/for-you?days=7&limit=20`, { cache: "no-store" });
  const data = (response.ok ? await response.json() : { windowDays: 7, items: [] }) as ForYouResponse;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">For You</h1>
      <p className="text-sm text-gray-700">Personalized events in the next {data.windowDays} days based on your follows, saved searches, location, and recent clicks.</p>
      {data.items.length === 0 ? (
        <EmptyState
          title="We need a little signal to personalize this"
          description="Follow a venue or artist, save a search, or set your location."
          actions={[
            { label: "Follow venues", href: "/venues", variant: "secondary" },
            { label: "Follow artists", href: "/artists", variant: "secondary" },
            { label: "Set location", href: "/account", variant: "secondary" },
            { label: "Save a search", href: "/search", variant: "secondary" },
          ]}
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <article className="rounded border p-4" key={item.event.id}>
              <h2 className="text-lg font-semibold">{item.event.title}</h2>
              <p className="text-sm text-gray-700">{new Date(item.event.startAt).toLocaleString()} · {item.event.venue?.name ?? "Unknown venue"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.reasons.slice(0, 3).map((reason) => (
                  <span key={reason} className="rounded-full bg-gray-100 px-2 py-1 text-xs">{reason}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Score: {item.score}</p>
              <FeedbackButtons eventId={item.event.id} surface="SEARCH" />
              <Link className="mt-2 inline-block underline" href={`/events/${item.event.slug}`}>View event</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
