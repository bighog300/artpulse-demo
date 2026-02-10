import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

type SItem = { slug: string; updatedAt?: Date };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL missing; returning empty sitemap.");
    return [];
  }

  const [eventsRaw, venuesRaw, artistsRaw] = await Promise.all([
    db.event.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
    db.venue.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
    db.artist.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }) as Promise<SItem[]>,
  ]);

  return [
    ...eventsRaw.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: e.updatedAt })),
    ...venuesRaw.map((v) => ({ url: `${base}/venues/${v.slug}`, lastModified: v.updatedAt })),
    ...artistsRaw.map((a) => ({ url: `${base}/artists/${a.slug}`, lastModified: a.updatedAt })),
  ];
}
