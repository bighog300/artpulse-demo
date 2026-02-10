import { notFound } from "next/navigation";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Venue details for ${slug}` };
}

export default async function VenueDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, include: { events: { where: { isPublished: true } } } });
  if (!venue) notFound();
  return <main className="p-6 space-y-3"><h1 className="text-3xl font-semibold">{venue.name}</h1><p>{venue.description}</p><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"Place",name:venue.name}) }} /></main>;
}
