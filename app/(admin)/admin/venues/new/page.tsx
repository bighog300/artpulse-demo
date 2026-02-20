import AdminEntityForm from "@/app/(admin)/admin/_components/AdminEntityForm";

export default function AdminNewVenue() {
  return (
    <AdminEntityForm
      title="New Venue"
      endpoint="/api/admin/venues"
      method="POST"
      redirectPath="/admin/venues"
      uploadTargetType="venue"
      uploadTargetId="new"
      initial={{ name: "", slug: "", description: "", city: "", country: "", lat: "", lng: "", websiteUrl: "", instagramUrl: "", contactEmail: "", featuredImageUrl: "", featuredAssetId: "", isPublished: false }}
      fields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "description", label: "Description" },
        { name: "city", label: "City" },
        { name: "country", label: "Country" },
        { name: "lat", label: "Latitude" },
        { name: "lng", label: "Longitude" },
        { name: "websiteUrl", label: "Website URL" },
        { name: "instagramUrl", label: "Instagram URL" },
        { name: "contactEmail", label: "Contact Email" },
        { name: "featuredImageUrl", label: "Featured Image URL" },
        { name: "featuredAssetId", label: "Featured Asset ID" },
      ]}
    />
  );
}
