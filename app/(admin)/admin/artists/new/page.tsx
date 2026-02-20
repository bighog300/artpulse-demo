import AdminEntityForm from "@/app/(admin)/admin/_components/AdminEntityForm";

export default function AdminNewArtist() {
  return (
    <AdminEntityForm
      title="New Artist"
      endpoint="/api/admin/artists"
      method="POST"
      redirectPath="/admin/artists"
      uploadTargetType="artist"
      uploadTargetId="new"
      initial={{ name: "", slug: "", bio: "", websiteUrl: "", instagramUrl: "", avatarImageUrl: "", featuredImageUrl: "", featuredAssetId: "", isPublished: false }}
      fields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "bio", label: "Bio" },
        { name: "websiteUrl", label: "Website URL" },
        { name: "instagramUrl", label: "Instagram URL" },
        { name: "avatarImageUrl", label: "Avatar Image URL" },
        { name: "featuredImageUrl", label: "Featured Image URL" },
        { name: "featuredAssetId", label: "Featured Asset ID" },
      ]}
    />
  );
}
