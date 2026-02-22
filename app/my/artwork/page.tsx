import Link from "next/link";
import { redirectToLogin } from "@/lib/auth-redirect";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyArtworkEmptyState } from "@/components/artwork/my-artwork-empty-state";
import { computeArtworkCompleteness } from "@/lib/artwork-completeness";

export default async function MyArtworkPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/artwork");

  const { filter } = await searchParams;
  const artist = await db.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
  const items = await db.artwork.findMany({
    where: user.role === "ADMIN" ? {} : {
      artistId: artist?.id,
      ...(filter === "draft" ? { isPublished: false } : {}),
      ...(filter === "missingCover" ? { featuredAssetId: null, images: { none: {} } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, isPublished: true, description: true, year: true, medium: true, featuredAssetId: true, _count: { select: { images: true } } },
  });

  return (
    <main className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Artwork</h1>
        <Button asChild><Link href="/my/artwork/new">Add artwork</Link></Button>
      </div>
      {items.length === 0 ? (
        <MyArtworkEmptyState />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const completeness = computeArtworkCompleteness(item, item._count.images);
            return (
              <li key={item.id} className="rounded border p-3">
                <Link className="underline" href={`/my/artwork/${item.id}`}>{item.title}</Link>{" "}
                <span className="text-sm text-muted-foreground">({item.isPublished ? "Published" : "Draft"})</span>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Completeness:</span>
                  <Badge variant={completeness.required.ok ? "default" : "secondary"}>{completeness.required.ok ? "Ready" : "Needs work"}</Badge>
                  <span className="text-muted-foreground">{completeness.scorePct}%</span>
                </div>
                {!completeness.required.ok ? <p className="mt-1 text-xs text-muted-foreground">Add a title and at least one image to publish.</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
