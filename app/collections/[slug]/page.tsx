import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { getPublishedCuratedCollectionBySlug } from "@/lib/curated-collections";
import { getArtworkPublicHref } from "@/lib/artworks";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getPublishedCuratedCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <PageShell className="page-stack">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{collection.title}</h1>
        {collection.description ? <p className="text-sm text-muted-foreground">{collection.description}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collection.artworks.map((artwork) => (
          <Link key={artwork.id} href={getArtworkPublicHref(artwork)} className="rounded border p-2">
            <div className="relative mb-2 h-40 overflow-hidden rounded bg-muted">
              {artwork.coverUrl ? <Image src={artwork.coverUrl} alt={artwork.title} fill className="object-cover" /> : null}
            </div>
            <div className="font-medium">{artwork.title}</div>
            <div className="text-xs text-muted-foreground">{artwork.artist.name}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
