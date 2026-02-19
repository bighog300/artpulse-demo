import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type EntityCardProps = {
  href: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  action?: ReactNode;
};

export function EntityCard({ href, name, subtitle, description, imageUrl, tags = [], action }: EntityCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {imageUrl ? <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          {description ? <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p> : null}
          {tags.length ? <div className="flex flex-wrap gap-1">{tags.slice(0, 2).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div> : null}
        </div>
      </Link>
      {action ? <div className="border-t p-3">{action}</div> : null}
    </Card>
  );
}
