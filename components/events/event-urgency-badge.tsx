import { Badge } from "@/components/ui/badge";
import type { EventUrgencyStatus } from "@/lib/events/event-urgency";
import { cn } from "@/lib/utils";

type EventUrgencyBadgeProps = {
  status: EventUrgencyStatus;
  className?: string;
};

export function EventUrgencyBadge({ status, className }: EventUrgencyBadgeProps) {
  if (status === "happening_now") {
    return (
      <Badge className={cn("gap-1.5 border-transparent bg-black/70 text-white backdrop-blur-sm", className)}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
        </span>
        Happening Now
      </Badge>
    );
  }

  if (status === "closing_soon") {
    return <Badge className={cn("border-amber-500/40 bg-amber-100/90 text-amber-900", className)}>Closing Soon</Badge>;
  }

  return <Badge className={cn("border-emerald-500/40 bg-emerald-100/90 text-emerald-900", className)}>Opening Soon</Badge>;
}
