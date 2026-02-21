import React from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ArtworkCountBadgeProps = {
  count: number;
  href: string;
  className?: string;
  badgeClassName?: string;
  subtle?: boolean;
};

export function ArtworkCountBadge({ count, href, className, badgeClassName, subtle = false }: ArtworkCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <Link href={href} className={className}>
      <Badge variant={subtle ? "secondary" : "outline"} className={`inline-flex items-center gap-1 whitespace-nowrap ${badgeClassName ?? ""}`}>
        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{count} {count === 1 ? "Artwork" : "Artworks"}</span>
      </Badge>
    </Link>
  );
}
