import Link from "next/link";
import { redirectToLogin } from "@/lib/auth-redirect";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MyArtworkEmptyState } from "@/components/artwork/my-artwork-empty-state";

export default async function MyArtworkPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/artwork");

  const artist = await db.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
  const items = await db.artwork.findMany({ where: user.role === "ADMIN" ? {} : { artistId: artist?.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, isPublished: true } });

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
          {items.map((item) => <li key={item.id} className="rounded border p-3"><Link className="underline" href={`/my/artwork/${item.id}`}>{item.title}</Link> <span className="text-sm text-muted-foreground">({item.isPublished ? "Published" : "Draft"})</span></li>)}
        </ul>
      )}
    </main>
  );
}
