"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEngagement } from "@/lib/engagement-client";

type FollowButtonProps = {
  targetType: "ARTIST" | "VENUE";
  targetId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  isAuthenticated: boolean;
};

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
    setIsFollowing(nextIsFollowing);
    setFollowersCount((prev) => Math.max(0, prev + (nextIsFollowing ? 1 : -1)));
    setIsSaving(true);

    const response = await fetch("/api/follows", {
      method: nextIsFollowing ? "POST" : "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
    });

    if (!response.ok) {
      setIsFollowing(!nextIsFollowing);
      setFollowersCount((prev) => Math.max(0, prev + (nextIsFollowing ? -1 : 1)));
    } else {
      trackEngagement({
        surface: "FOLLOWING",
        action: "FOLLOW",
        targetType,
        targetId,
      });
    }

    setIsSaving(false);
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
