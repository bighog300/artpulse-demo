"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FollowButton } from "@/components/follows/follow-button";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Crect width='100%25' height='100%25' fill='%23f4f4f5'/%3E%3C/svg%3E";

type ArtistCardProps = {
  href: string;
  name: string;
  imageUrl?: string | null;
  bio?: string | null;
  tags?: string[];
  isAuthenticated: boolean;
  initialFollowing?: boolean;
  artistId: string;
};

export function ArtistCard({
  href,
  name,
  imageUrl,
  bio,
  tags = [],
  isAuthenticated,
  initialFollowing = false,
  artistId,
}: ArtistCardProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg border bg-white motion-safe:transition-colors motion-safe:transition-shadow motion-safe:duration-150 motion-reduce:transition-none hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-zinc-100">
          <Image src={imageUrl || PLACEHOLDER} alt={name} fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 font-semibold text-zinc-900 group-hover:underline">{name}</h2>
            <div
              className="shrink-0"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <FollowButton
                targetType="ARTIST"
                targetId={artistId}
                initialIsFollowing={initialFollowing}
                initialFollowersCount={0}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
          {bio ? (
            <p className="text-sm text-zinc-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{bio}</p>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="rounded-full border bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-200"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    router.push(`/events?tags=${encodeURIComponent(tag)}`);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
