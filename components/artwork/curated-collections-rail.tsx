import Link from "next/link";
import Image from "next/image";
import { listPublishedCuratedCollections } from "@/lib/curated-collections";
import { getArtworkPublicHref } from "@/lib/artworks";

export async function CuratedCollectionsRail() {
  const collections = await listPublishedCuratedCollections(8);
  if (!collections.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Featured collections</h2>
      <div className="space-y-4">
        {collections.map((collection) => (
          <div key={collection.id} className="rounded border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{collection.title}</h3>
                {collection.description ? <p className="text-sm text-muted-foreground">{collection.description}</p> : null}
              </div>
              <Link href={`/collections/${collection.slug}`} className="text-sm underline">View collection</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {collection.artworks.map((artwork) => (
                <Link key={artwork.id} href={getArtworkPublicHref(artwork)} className="space-y-1">
                  <div className="relative h-24 overflow-hidden rounded bg-muted">
                    {artwork.coverUrl ? <Image src={artwork.coverUrl} alt={artwork.title} fill className="object-cover" /> : null}
                  </div>
                  <p className="line-clamp-1 text-xs font-medium">{artwork.title}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
