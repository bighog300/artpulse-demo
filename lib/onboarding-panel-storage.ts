const DISMISS_KEY = "artpulse:onboarding-panel-dismissed";

export function isOnboardingPanelDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function setOnboardingPanelDismissed(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(DISMISS_KEY, "1");
    return;
  }
  window.localStorage.removeItem(DISMISS_KEY);
}
