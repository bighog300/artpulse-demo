import SimpleAdminForm from "@/app/admin/_components/SimpleAdminForm";

export default function AdminNewArtist() {
  return (
    <SimpleAdminForm
      title="New Artist"
      endpoint="/api/admin/artists"
      method="POST"
      initial={{ name: "", slug: "", bio: "", websiteUrl: "", instagramUrl: "", avatarImageUrl: "", isPublished: false }}
      fields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "bio", label: "Bio" },
        { name: "websiteUrl", label: "Website URL" },
        { name: "instagramUrl", label: "Instagram URL" },
        { name: "avatarImageUrl", label: "Avatar Image URL" },
      ]}
    />
  );
}
