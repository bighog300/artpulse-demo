import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artwork = await db.artwork.findUnique({ where: { id }, include: { artist: true, featuredAsset: true, images: { include: { asset: true }, orderBy: { sortOrder: "asc" } }, venues: { include: { venue: true } }, events: { include: { event: true } } } });
  if (!artwork || !artwork.isPublished) notFound();
  const cover = resolveImageUrl(artwork.featuredAsset?.url, artwork.images[0]?.asset?.url);

  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">{artwork.title}</h1><p className="text-sm text-muted-foreground">by <Link className="underline" href={`/artists/${artwork.artist.slug}`}>{artwork.artist.name}</Link></p>{cover ? <div className="relative h-80 w-full overflow-hidden rounded border"><Image src={cover} alt={artwork.title} fill className="object-cover" /></div> : null}<p>{artwork.description}</p><p className="text-sm">{artwork.year ?? ""} {artwork.medium ?? ""} {artwork.dimensions ?? ""}</p><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{artwork.images.map((image) => <div key={image.id} className="relative h-32 overflow-hidden rounded border"><Image src={image.asset.url} alt={image.alt ?? artwork.title} fill className="object-cover" /></div>)}</div><div className="text-sm">Venues: {artwork.venues.map((v) => v.venue.name).join(", ") || "None"}</div><div className="text-sm">Events: {artwork.events.map((e) => e.event.title).join(", ") || "None"}</div></main>;
}
