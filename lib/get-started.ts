export type GetStartedSignals = {
  hasFollowed: boolean;
  hasLocation: boolean;
  hasSavedSearch: boolean;
};

export type GetStartedStep = {
  key: "follow" | "location" | "savedSearch";
  title: string;
  description: string;
  done: boolean;
  ctas: Array<{ label: string; href: string }>;
};

export type GetStartedProgress = {
  steps: GetStartedStep[];
  completedCount: number;
  totalCount: number;
  completedAll: boolean;
  currentStepNumber: number;
};

export function computeGetStartedProgress(signals: GetStartedSignals): GetStartedProgress {
  const steps: GetStartedStep[] = [
    {
      key: "follow",
      title: "Follow at least 1 venue or artist",
      description: "Follow artists or venues to personalize your feed.",
      done: signals.hasFollowed,
      ctas: [
        { label: "Browse venues", href: "/venues" },
        { label: "Browse artists", href: "/artists" },
        { label: "View following", href: "/following" },
      ],
    },
    {
      key: "location",
      title: "Set your location",
      description: "Optional but recommended for nearby and local recommendations.",
      done: signals.hasLocation,
      ctas: [
        { label: "Update location", href: "/account" },
        { label: "Open nearby", href: "/nearby" },
      ],
    },
    {
      key: "savedSearch",
      title: "Save your first search",
      description: "Create a saved search from Search or Nearby to get alerts.",
      done: signals.hasSavedSearch,
      ctas: [
        { label: "Search events", href: "/search" },
        { label: "Saved searches", href: "/saved-searches" },
      ],
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const totalCount = steps.length;
  const completedAll = completedCount === totalCount;
  const firstIncomplete = steps.findIndex((step) => !step.done);

  return {
    steps,
    completedCount,
    totalCount,
    completedAll,
    currentStepNumber: completedAll ? totalCount : firstIncomplete + 1,
  };
}
