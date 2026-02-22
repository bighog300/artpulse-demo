import { db } from "@/lib/db";
import { ensureDbUserForSession, type SessionUserLike } from "@/lib/ensure-db-user-for-session";
import { logWarn } from "@/lib/logging";

export const onboardingFlags = [
  "hasFollowedSomething",
  "hasVisitedFollowing",
  "hasAcceptedInvite",
  "hasCreatedVenue",
  "hasSubmittedEvent",
  "hasViewedNotifications",
] as const;

export type OnboardingFlagName = (typeof onboardingFlags)[number];

export type OnboardingStateRecord = {
  id: string;
  userId: string;
  completedAt: Date | null;
  hasFollowedSomething: boolean;
  hasVisitedFollowing: boolean;
  hasAcceptedInvite: boolean;
  hasCreatedVenue: boolean;
  hasSubmittedEvent: boolean;
  hasViewedNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OnboardingChecklistItem = {
  flag: OnboardingFlagName;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export async function getOnboardingState(userId: string): Promise<OnboardingStateRecord | null> {
  return db.onboardingState.findUnique({ where: { userId } });
}

export async function maybeCompleteOnboarding(state: OnboardingStateRecord) {
  const meetsRequirements =
    state.hasFollowedSomething
    && (state.hasAcceptedInvite || state.hasCreatedVenue)
    && state.hasViewedNotifications;

  if (!meetsRequirements || state.completedAt) return state;

  return db.onboardingState.update({
    where: { userId: state.userId },
    data: { completedAt: new Date() },
  });
}

export async function setOnboardingFlag(userId: string, flagName: OnboardingFlagName, value = true) {
  const state = await db.onboardingState.upsert({
    where: { userId },
    create: {
      userId,
      [flagName]: value,
    },
    update: {
      [flagName]: value,
    },
  });

  await maybeCompleteOnboarding(state);
}

function isForeignKeyViolation(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: string }).code === "P2003";
}

export async function setOnboardingFlagForSession(
  sessionUser: SessionUserLike | null | undefined,
  flagName: OnboardingFlagName,
  value = true,
  context: { path?: string } = {},
) {
  const dbUser = await ensureDbUserForSession(sessionUser);
  if (!dbUser) {
    logWarn({
      message: "onboarding_state_skipped_missing_db_user",
      path: context.path,
      sessionUserEmail: sessionUser?.email ?? null,
      flagName,
    });
    return;
  }

  try {
    await setOnboardingFlag(dbUser.id, flagName, value);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      logWarn({
        message: "onboarding_state_upsert_fk_violation",
        path: context.path,
        userId: dbUser.id,
        sessionUserEmail: sessionUser?.email ?? null,
        flagName,
      });
      return;
    }
    throw error;
  }
}

export async function markOnboardingCompleted(userId: string) {
  await db.onboardingState.upsert({
    where: { userId },
    create: { userId, completedAt: new Date() },
    update: { completedAt: new Date() },
  });
}

export async function markOnboardingCompletedForSession(sessionUser: SessionUserLike | null | undefined, context: { path?: string } = {}) {
  const dbUser = await ensureDbUserForSession(sessionUser);
  if (!dbUser) {
    logWarn({
      message: "onboarding_complete_skipped_missing_db_user",
      path: context.path,
      sessionUserEmail: sessionUser?.email ?? null,
    });
    return;
  }

  try {
    await markOnboardingCompleted(dbUser.id);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      logWarn({
        message: "onboarding_complete_fk_violation",
        path: context.path,
        userId: dbUser.id,
        sessionUserEmail: sessionUser?.email ?? null,
      });
      return;
    }
    throw error;
  }
}

export function computeChecklist(
  state: OnboardingStateRecord | null,
  options: { hasVenueMembership?: boolean } = {},
): OnboardingChecklistItem[] {
  const submitHref = options.hasVenueMembership ? "/my/venues" : "/my/venues";

  return [
    {
      flag: "hasFollowedSomething",
      title: "Follow an artist or venue",
      description: "Build a personalized feed and get updates from places you care about.",
      href: "/following",
      done: Boolean(state?.hasFollowedSomething),
    },
    {
      flag: "hasAcceptedInvite",
      title: "Accept pending invites",
      description: "Join your team’s venues to help manage profiles and submissions.",
      href: "/my/venues",
      done: Boolean(state?.hasAcceptedInvite),
    },
    {
      flag: "hasCreatedVenue",
      title: "Create or manage a venue",
      description: "Set up your venue details so audiences can discover your space.",
      href: "/my/venues",
      done: Boolean(state?.hasCreatedVenue),
    },
    {
      flag: "hasSubmittedEvent",
      title: "Submit an event",
      description: "Publish an event draft for moderation and listing.",
      href: submitHref,
      done: Boolean(state?.hasSubmittedEvent),
    },
    {
      flag: "hasViewedNotifications",
      title: "Check notifications",
      description: "Stay on top of invites, approvals, and moderation updates.",
      href: "/notifications",
      done: Boolean(state?.hasViewedNotifications),
    },
  ];
}
