import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Event details for ${slug}` };
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const event = await db.event.findFirst({
    where: { slug, isPublished: true },
    include: { venue: true, eventTags: { include: { tag: true } }, images: { include: { asset: { select: { url: true } } }, orderBy: { sortOrder: "asc" } } },
  });

  if (!event) notFound();
  const primaryImage = resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url);

  return (
    <main className="space-y-3 p-6">
      <h1 className="text-3xl font-semibold">{event.title}</h1>
      {primaryImage ? <img src={primaryImage} alt={event.images[0]?.alt ?? event.title} className="h-64 w-full max-w-xl object-cover rounded border" /> : null}
      <p>{event.description}</p>
      <p>{new Date(event.startAt).toISOString()}</p>
      <form action="/api/favorites" method="post">
        <input type="hidden" name="targetType" value="EVENT" />
        <input type="hidden" name="targetId" value={event.id} />
        <button className="rounded border px-3 py-1">Save</button>
      </form>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            startDate: event.startAt,
            location: event.venue ? { "@type": "Place", name: event.venue.name } : undefined,
          }),
        }}
      />
    </main>
  );
}
