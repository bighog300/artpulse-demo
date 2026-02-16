import Image from "next/image";
import type { ReactNode } from "react";

type VenueHeroProps = {
  name: string;
  imageUrl?: string | null;
  locationText?: string | null;
  description?: string | null;
  followSlot?: ReactNode;
  metaSlot?: ReactNode;
};

export function VenueHero({ name, imageUrl, locationText, description, followSlot, metaSlot }: VenueHeroProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 md:aspect-auto md:min-h-[240px]">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No cover image</div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
              {locationText ? <p className="text-sm text-zinc-600">{locationText}</p> : null}
            </div>
            {followSlot ? <div className="md:self-start">{followSlot}</div> : null}
          </div>
          {metaSlot ? <div className="flex flex-wrap items-center gap-2">{metaSlot}</div> : null}
          {description ? <p className="text-sm text-zinc-700 line-clamp-3">{description}</p> : null}
        </div>
      </div>
    </section>
  );
}
