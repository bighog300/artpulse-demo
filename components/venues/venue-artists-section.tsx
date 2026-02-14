import type { ArtistSummary } from "@/lib/venue-associated-artists";
import { VenueArtistCard } from "@/components/venues/venue-artist-card";

export function VenueArtistsSection({ verifiedArtists, derivedArtists }: { verifiedArtists: ArtistSummary[]; derivedArtists: ArtistSummary[] }) {
  if (verifiedArtists.length === 0 && derivedArtists.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Artists</h2>
        <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No associated artists yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Artists</h2>

      {verifiedArtists.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Verified</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {verifiedArtists.map((artist) => (
              <li key={`verified-${artist.id}`}>
                <VenueArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {derivedArtists.length > 0 ? (
        <details className="rounded border p-4" open>
          <summary className="cursor-pointer text-lg font-medium">From exhibitions ({derivedArtists.length})</summary>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {derivedArtists.map((artist) => (
              <li key={`derived-${artist.id}`}>
                <VenueArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
