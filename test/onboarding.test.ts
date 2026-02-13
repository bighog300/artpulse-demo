import test from "node:test";
import assert from "node:assert/strict";
import { computeChecklist, type OnboardingStateRecord } from "../lib/onboarding.ts";
import { isOnboardingPanelDismissed, setOnboardingPanelDismissed } from "../lib/onboarding-panel-storage.ts";
import { GET as getOnboarding } from "../app/api/onboarding/route.ts";

const baseState: OnboardingStateRecord = {
  id: "state-1",
  userId: "user-1",
  completedAt: null,
  hasFollowedSomething: false,
  hasVisitedFollowing: false,
  hasAcceptedInvite: false,
  hasCreatedVenue: false,
  hasSubmittedEvent: false,
  hasViewedNotifications: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

test("onboarding checklist marks incomplete flags as not done", () => {
  const checklist = computeChecklist(baseState);

  assert.equal(checklist.length, 5);
  assert.equal(checklist.filter((item) => item.done).length, 0);
  assert.deepEqual(checklist.map((item) => item.href), ["/following", "/my/venues", "/my/venues", "/my/venues", "/notifications"]);
});

test("onboarding checklist marks completed flags", () => {
  const checklist = computeChecklist({
    ...baseState,
    hasFollowedSomething: true,
    hasAcceptedInvite: true,
    hasSubmittedEvent: true,
  });

  const doneFlags = checklist.filter((item) => item.done).map((item) => item.flag);
  assert.deepEqual(doneFlags, ["hasFollowedSomething", "hasAcceptedInvite", "hasSubmittedEvent"]);
});

test("dismissed onboarding panel state is client-only", () => {
  const originalWindow = globalThis.window;
  // @ts-expect-error test override
  delete globalThis.window;

  assert.equal(isOnboardingPanelDismissed(), false);
  assert.doesNotThrow(() => setOnboardingPanelDismissed(true));

  const storage = new Map<string, string>();
  // @ts-expect-error test override
  globalThis.window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
  };

  setOnboardingPanelDismissed(true);
  assert.equal(isOnboardingPanelDismissed(), true);
  setOnboardingPanelDismissed(false);
  assert.equal(isOnboardingPanelDismissed(), false);

  if (originalWindow) {
    // @ts-expect-error test restore
    globalThis.window = originalWindow;
  } else {
    // @ts-expect-error test restore
    delete globalThis.window;
  }
});

test("/api/onboarding requires authentication", async () => {
  const response = await getOnboarding();
  assert.equal(response.status, 401);
});
