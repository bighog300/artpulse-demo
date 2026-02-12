import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Artist details for ${slug}` };
}

export default async function ArtistDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const artist = await db.artist.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } }, eventArtists: { include: { event: true } } } });

  if (!artist) notFound();
  const imageUrl = resolveImageUrl(artist.featuredAsset?.url, artist.avatarImageUrl);

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{artist.name}</h1>
      {imageUrl ? <img src={imageUrl} alt={artist.name} className="h-64 w-full max-w-xl object-cover rounded border" /> : null}
      <p>{artist.bio}</p>
    </main>
  );
}
