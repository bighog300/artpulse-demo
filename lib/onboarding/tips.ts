export type PostActivationTip = {
  id: string;
  title: string;
  description: string;
  destination: string;
  ctaLabel: string;
};

export const POST_ACTIVATION_TIPS: PostActivationTip[] = [
  { id: "save-search-digest", title: "Save a search to get weekly digests", description: "Create a focused query and we will send updates when new matches land.", destination: "/search", ctaLabel: "Create saved search" },
  { id: "use-nearby", title: "Use Nearby to see what’s close", description: "Turn on location to discover events around you in a tap.", destination: "/nearby", ctaLabel: "Open Nearby" },
  { id: "save-events-calendar", title: "Save events to build your calendar", description: "Bookmark events now and keep your upcoming plans in one place.", destination: "/events", ctaLabel: "Explore events" },
];
