import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/components/follows/follow-button";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23f4f4f5'/%3E%3C/svg%3E";

type ArtistHeaderProps = {
  name: string;
  imageUrl?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  followerCount?: number;
  isAuthenticated?: boolean;
  artistId?: string;
  tags?: string[];
  roleSlot?: ReactNode;
};

export function ArtistHeader({
  name,
  imageUrl,
  bio,
  isFollowing = false,
  followerCount = 0,
  isAuthenticated = false,
  artistId,
  tags = [],
  roleSlot,
}: ArtistHeaderProps) {
  return (
    <section className="rounded border p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded border bg-muted">
          <Image
            src={imageUrl || PLACEHOLDER}
            alt={name}
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-3xl font-semibold">{name}</h1>
          {bio ? (
            <p className="text-sm text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">{bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No artist statement yet.</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {artistId ? (
              <FollowButton
                targetType="ARTIST"
                targetId={artistId}
                initialIsFollowing={isFollowing}
                initialFollowersCount={followerCount}
                isAuthenticated={isAuthenticated}
              />
            ) : null}
            <p className="text-xs text-muted-foreground">{followerCount.toLocaleString()} followers</p>
            {roleSlot}
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/events?tags=${encodeURIComponent(tag)}`}
                  className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/50"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
