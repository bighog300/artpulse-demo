const DISMISSED_KEY = "ap_onboarding_dismissed";
const COMPLETED_KEY = "ap_onboarding_completed";
const SEEN_AT_KEY = "ap_onboarding_seen_at";
const STEP_KEY = "ap_onboarding_step";

type StoredStep = "follow" | "saved_search" | "saved_event" | "location" | "done";

type OnboardingStoredState = {
  dismissed: boolean;
  completed: boolean;
  seenAt: number | null;
  step: StoredStep | null;
};

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readBoolean(key: string): boolean {
  return getStorage()?.getItem(key) === "true";
}

function writeBoolean(key: string, value: boolean) {
  getStorage()?.setItem(key, String(value));
}

export function getOnboardingState(): OnboardingStoredState {
  const storage = getStorage();
  if (!storage) return { dismissed: false, completed: false, seenAt: null, step: null };

  const seenRaw = storage.getItem(SEEN_AT_KEY);
  const parsedSeen = seenRaw ? Number(seenRaw) : Number.NaN;
  const stepRaw = storage.getItem(STEP_KEY);

  return {
    dismissed: readBoolean(DISMISSED_KEY),
    completed: readBoolean(COMPLETED_KEY),
    seenAt: Number.isFinite(parsedSeen) ? parsedSeen : null,
    step: stepRaw as StoredStep | null,
  };
}

export function setOnboardingDismissed(value: boolean) {
  writeBoolean(DISMISSED_KEY, value);
}

export function setOnboardingCompleted(value: boolean) {
  writeBoolean(COMPLETED_KEY, value);
}

export function setOnboardingSeenAt(timestamp: number = Date.now()) {
  getStorage()?.setItem(SEEN_AT_KEY, String(timestamp));
}

export function setOnboardingStep(step: StoredStep) {
  getStorage()?.setItem(STEP_KEY, step);
}

export function clearOnboardingState() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(DISMISSED_KEY);
  storage.removeItem(COMPLETED_KEY);
  storage.removeItem(SEEN_AT_KEY);
  storage.removeItem(STEP_KEY);
}
