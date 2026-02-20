const DISMISSED_KEY = "ap_onboarding_dismissed";
const COMPLETED_KEY = "ap_onboarding_completed";
const SEEN_AT_KEY = "ap_onboarding_seen_at";
const STEP_KEY = "ap_onboarding_step";
const COMPLETED_AT_KEY = "ap_onboarding_completed_at";
const TIPS_SEEN_KEY = "ap_tips_seen";
const TIPS_DISMISSED_KEY = "ap_tips_dismissed";
const CHECKLIST_DISMISSED_KEY = "ap_setup_checklist_dismissed";
const BANNER_MINIMIZED_KEY = "ap_banner_minimized";

type StoredStep = "follow" | "saved_search" | "saved_event" | "location" | "done";

type OnboardingStoredState = {
  dismissed: boolean;
  completed: boolean;
  seenAt: number | null;
  step: StoredStep | null;
  completedAt: number | null;
};

type TipsState = {
  seenIds: string[];
  dismissed: boolean;
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

function readJsonArray(key: string): string[] {
  const raw = getStorage()?.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function getOnboardingState(): OnboardingStoredState {
  const storage = getStorage();
  if (!storage) return { dismissed: false, completed: false, seenAt: null, step: null, completedAt: null };

  const seenRaw = storage.getItem(SEEN_AT_KEY);
  const parsedSeen = seenRaw ? Number(seenRaw) : Number.NaN;
  const stepRaw = storage.getItem(STEP_KEY);
  const completedAtRaw = storage.getItem(COMPLETED_AT_KEY);
  const parsedCompletedAt = completedAtRaw ? Number(completedAtRaw) : Number.NaN;

  return {
    dismissed: readBoolean(DISMISSED_KEY),
    completed: readBoolean(COMPLETED_KEY),
    seenAt: Number.isFinite(parsedSeen) ? parsedSeen : null,
    step: stepRaw as StoredStep | null,
    completedAt: Number.isFinite(parsedCompletedAt) ? parsedCompletedAt : null,
  };
}

export function setOnboardingDismissed(value: boolean) {
  writeBoolean(DISMISSED_KEY, value);
}

export function setOnboardingCompleted(value: boolean) {
  writeBoolean(COMPLETED_KEY, value);
  if (value) {
    getStorage()?.setItem(COMPLETED_AT_KEY, String(Date.now()));
    return;
  }
  getStorage()?.removeItem(COMPLETED_AT_KEY);
}

export function setOnboardingSeenAt(timestamp: number = Date.now()) {
  getStorage()?.setItem(SEEN_AT_KEY, String(timestamp));
}

export function setOnboardingStep(step: StoredStep) {
  getStorage()?.setItem(STEP_KEY, step);
}

export function getTipsState(): TipsState {
  return { seenIds: readJsonArray(TIPS_SEEN_KEY), dismissed: readBoolean(TIPS_DISMISSED_KEY) };
}

export function markTipSeen(tipId: string) {
  const next = Array.from(new Set([...readJsonArray(TIPS_SEEN_KEY), tipId]));
  getStorage()?.setItem(TIPS_SEEN_KEY, JSON.stringify(next));
}

export function dismissTips() {
  writeBoolean(TIPS_DISMISSED_KEY, true);
}

export function getChecklistDismissed() {
  return readBoolean(CHECKLIST_DISMISSED_KEY);
}

export function dismissChecklist() {
  writeBoolean(CHECKLIST_DISMISSED_KEY, true);
}


export function getBannerMinimized() {
  return readBoolean(BANNER_MINIMIZED_KEY);
}

export function setBannerMinimized(value: boolean) {
  writeBoolean(BANNER_MINIMIZED_KEY, value);
}

export function clearOnboardingState() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(DISMISSED_KEY);
  storage.removeItem(COMPLETED_KEY);
  storage.removeItem(SEEN_AT_KEY);
  storage.removeItem(STEP_KEY);
  storage.removeItem(COMPLETED_AT_KEY);
  storage.removeItem(TIPS_SEEN_KEY);
  storage.removeItem(TIPS_DISMISSED_KEY);
  storage.removeItem(CHECKLIST_DISMISSED_KEY);
  storage.removeItem(BANNER_MINIMIZED_KEY);
}
