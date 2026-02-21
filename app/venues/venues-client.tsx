"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityListControls } from "@/components/entities/entity-list-controls";
import { FollowButton } from "@/components/follows/follow-button";
import { EmptyState } from "@/components/ui/empty-state";

type VenueListItem = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  followersCount: number;
  isFollowing: boolean;
};

export function VenuesClient({ venues, isAuthenticated }: { venues: VenueListItem[]; isAuthenticated: boolean }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const sort = searchParams.get("sort") ?? "az";

  const filtered = useMemo(() => {
    const searched = venues.filter((venue) => !q || venue.name.toLowerCase().includes(q) || venue.subtitle.toLowerCase().includes(q));
    if (sort === "followers") return [...searched].sort((a, b) => b.followersCount - a.followersCount || a.name.localeCompare(b.name));
    return [...searched].sort((a, b) => a.name.localeCompare(b.name));
  }, [venues, q, sort]);

  return (
    <div className="space-y-4">
      <EntityListControls searchPlaceholder="Search venues" sortOptions={[{ value: "az", label: "A–Z" }, { value: "followers", label: "Most Followed" }]} />
      {filtered.length === 0 ? (
        <EmptyState title="No venues match your search" description="Try a different venue name or clear filters." actions={[{ label: "Reset filters", href: "/venues" }]} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((venue) => (
            <EntityCard
              key={venue.id}
              href={`/venues/${venue.slug}`}
              name={venue.name}
              subtitle={venue.subtitle}
              description={venue.description}
              imageUrl={venue.imageUrl}
              imageAlt={venue.imageAlt}
              action={<div onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}><FollowButton targetType="VENUE" targetId={venue.id} initialIsFollowing={venue.isFollowing} initialFollowersCount={venue.followersCount} isAuthenticated={isAuthenticated} /></div>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
