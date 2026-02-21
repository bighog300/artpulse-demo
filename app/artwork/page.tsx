import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default async function ArtworkPage() {
  const items = await db.artwork.findMany({ where: { isPublished: true }, orderBy: { updatedAt: "desc" }, take: 60, select: { id: true, title: true, year: true, medium: true, artist: { select: { name: true } }, featuredAsset: { select: { url: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { asset: { select: { url: true } } } } } });
  return <PageShell className="page-stack"><PageHeader title="Artwork" subtitle="Browse published works from artists across ArtPulse." /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const cover = resolveImageUrl(item.featuredAsset?.url, item.images[0]?.asset?.url); return <Link key={item.id} href={`/artwork/${item.id}`} className="rounded border p-3 hover:bg-muted/40"><div className="relative mb-2 h-48 w-full overflow-hidden rounded bg-muted">{cover ? <Image src={cover} alt={item.title} fill className="object-cover" /> : null}</div><div className="font-medium">{item.title}</div><div className="text-sm text-muted-foreground">{item.artist.name}</div><div className="text-xs text-muted-foreground">{item.year ?? ""} {item.medium ?? ""}</div></Link>; })}</div></PageShell>;
}
