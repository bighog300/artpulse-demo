import Image from "next/image";
import Link from "next/link";
import type { ArtistSummary } from "@/lib/venue-associated-artists";

export function VenueArtistCard({ artist }: { artist: ArtistSummary }) {
  return (
    <Link href={`/artists/${artist.slug}`} className="group rounded border p-3 transition hover:border-zinc-400">
      {artist.coverUrl ? (
        <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded bg-zinc-100">
          <Image
            src={artist.coverUrl}
            alt={artist.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded bg-zinc-100 text-sm text-zinc-500">
          No image
        </div>
      )}
      <p className="font-medium underline-offset-2 group-hover:underline">{artist.name}</p>
    </Link>
  );
}
