import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

type SItem = { slug: string; updatedAt?: Date };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [eventsRaw, venuesRaw, artistsRaw] = await Promise.all([
    db.event.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
    db.venue.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
    db.artist.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
  ]);
  const events = eventsRaw ?? [];
  const venues = venuesRaw ?? [];
  const artists = artistsRaw ?? [];
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: e.updatedAt })),
    ...venues.map((v) => ({ url: `${base}/venues/${v.slug}`, lastModified: v.updatedAt })),
    ...artists.map((a) => ({ url: `${base}/artists/${a.slug}`, lastModified: a.updatedAt })),
  ];
}
