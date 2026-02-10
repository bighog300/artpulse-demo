import { notFound } from "next/navigation";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Event details for ${slug}` };
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, isPublished: true }, include: { venue: true, eventTags: { include: { tag: true } }, images: true } });
  if (!event) notFound();
  return <main className="p-6 space-y-3"><h1 className="text-3xl font-semibold">{event.title}</h1><p>{event.description}</p><p>{new Date(event.startAt).toISOString()}</p><form action="/api/favorites" method="post"><input type="hidden" name="targetType" value="EVENT" /><input type="hidden" name="targetId" value={event.id} /><button className="rounded border px-3 py-1">Save</button></form><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"Event",name:event.title,startDate:event.startAt,location:event.venue?{"@type":"Place",name:event.venue.name}:undefined}) }} /></main>;
}
