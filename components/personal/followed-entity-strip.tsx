import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FollowedEntityStripProps = {
  id: string;
  name: string;
  slug: string;
  targetType: "ARTIST" | "VENUE";
  upcomingEventsCount: number;
  onUnfollow: (target: { targetType: "ARTIST" | "VENUE"; targetId: string }) => void;
  isPending?: boolean;
};

export function FollowedEntityStrip({ id, name, slug, targetType, upcomingEventsCount, onUnfollow, isPending }: FollowedEntityStripProps) {
  const href = targetType === "ARTIST" ? `/artists/${slug}` : `/venues/${slug}`;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground" aria-hidden="true">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={href} className="line-clamp-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{targetType === "ARTIST" ? "Artist" : "Venue"}</Badge>
          <Badge variant="outline" className="text-[11px]">{upcomingEventsCount} upcoming</Badge>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => onUnfollow({ targetType, targetId: id })}
        aria-label={`Unfollow ${name}`}
      >
        Unfollow
      </Button>
    </li>
  );
}
