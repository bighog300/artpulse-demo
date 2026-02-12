import { notFound } from "next/navigation";
import SimpleAdminForm from "@/app/admin/_components/SimpleAdminForm";
import { db } from "@/lib/db";

export default async function AdminArtist({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await db.artist.findUnique({ where: { id } });
  if (!artist) notFound();

  return (
    <SimpleAdminForm
      title="Edit Artist"
      endpoint={`/api/admin/artists/${id}`}
      method="PATCH"
      initial={artist}
      fields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "bio", label: "Bio" },
        { name: "websiteUrl", label: "Website URL" },
        { name: "instagramUrl", label: "Instagram URL" },
        { name: "avatarImageUrl", label: "Avatar Image URL" },
        { name: "featuredAssetId", label: "Featured Asset ID" },
      ]}
    />
  );
}
