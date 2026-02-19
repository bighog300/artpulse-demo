import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type FeedItem = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  venue?: { name: string | null; slug: string | null } | null;
};

const FEED_OPTIONS = [
  { value: "7", label: "Upcoming" },
  { value: "3", label: "This weekend" },
  { value: "30", label: "Newly added" },
] as const;

export function PersonalEventFeed({
  items,
  selectedDays,
  selectedType,
  hasNoFollows,
}: {
  items: FeedItem[];
  selectedDays: "7" | "30";
  selectedType: "both" | "artist" | "venue";
  hasNoFollows: boolean;
}) {
  if (hasNoFollows) {
    return (
      <EmptyState
        title="Start following to unlock your feed"
        description="Follow a few artists and venues and we will surface the best upcoming events here."
        actions={[{ label: "Discover artists", href: "/artists", variant: "secondary" }, { label: "Discover venues", href: "/venues", variant: "secondary" }]}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FEED_OPTIONS.map((option) => {
          const params = new URLSearchParams({ days: option.value === "3" ? "7" : option.value, type: selectedType });
          return (
            <Button key={option.value} asChild variant={selectedDays === params.get("days") ? "default" : "outline"} size="sm">
              <Link href={`/following?${params.toString()}`}>{option.label}</Link>
            </Button>
          );
        })}
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No upcoming events yet"
          description="Try broadening your timeframe, or follow more artists and venues."
          actions={[{ label: "Expand to 30 days", href: `/following?days=30&type=${selectedType}` }, { label: "Explore events", href: "/events", variant: "secondary" }]}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((item) => (
            <li key={item.id}>
              <EventCard href={`/events/${item.slug}`} title={item.title} startAt={item.startAt} endAt={item.endAt} venueName={item.venue?.name ?? undefined} />
            </li>
          ))}
        </ul>
      )}
      {items.length > 9 ? <Link href={`/following?days=${selectedDays}&type=${selectedType}`} className="text-sm font-medium underline">See all events ({items.length})</Link> : null}
    </div>
  );
}
