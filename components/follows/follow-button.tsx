"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEngagement } from "@/lib/engagement-client";
import { enqueueToast } from "@/lib/toast";

type FollowButtonProps = {
  targetType: "ARTIST" | "VENUE";
  targetId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  isAuthenticated: boolean;
};

type ToggleDeps = {
  fetcher: (nextIsFollowing: boolean) => Promise<boolean>;
  onOptimistic: (nextIsFollowing: boolean) => void;
  onRevert: (nextIsFollowing: boolean) => void;
  onSuccess: (nextIsFollowing: boolean) => void;
  onError: () => void;
};

export async function runOptimisticFollowToggle(nextIsFollowing: boolean, deps: ToggleDeps) {
  deps.onOptimistic(nextIsFollowing);
  try {
    const ok = await deps.fetcher(nextIsFollowing);
    if (!ok) {
      deps.onRevert(nextIsFollowing);
      deps.onError();
      return;
    }
    deps.onSuccess(nextIsFollowing);
  } catch {
    deps.onRevert(nextIsFollowing);
    deps.onError();
  }
}

export function FollowButton({
  targetType,
  targetId,
  initialIsFollowing,
  initialFollowersCount,
  isAuthenticated,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isSaving, setIsSaving] = useState(false);

  async function onToggle() {
    if (!isAuthenticated || isSaving) return;

    const nextIsFollowing = !isFollowing;
    setIsSaving(true);

    await runOptimisticFollowToggle(nextIsFollowing, {
      onOptimistic: (next) => {
        setIsFollowing(next);
        setFollowersCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
      },
      fetcher: async (next) => {
        const response = await fetch("/api/follows", {
          method: next ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        });
        return response.ok;
      },
      onRevert: (next) => {
        setIsFollowing(!next);
        setFollowersCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
      },
      onSuccess: (next) => {
        trackEngagement({
          surface: "FOLLOWING",
          action: "FOLLOW",
          targetType,
          targetId,
        });
        enqueueToast({ title: next ? "Following updated" : "Unfollowed" });
      },
      onError: () => enqueueToast({ title: "Could not update follow", variant: "error" }),
    });

    setTimeout(() => setIsSaving(false), 600);
  }

  if (!isAuthenticated) {
    return (
      <Link className="inline-flex rounded border px-3 py-1 text-sm hover:bg-gray-50" href="/login">
        Sign in to follow · {followersCount}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSaving}
      className="inline-flex rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isFollowing ? "Following" : "Follow"} · {followersCount}
    </button>
  );
}
