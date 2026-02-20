import SimpleAdminForm from "@/app/(admin)/admin/_components/SimpleAdminForm";

export default function AdminNewVenue() {
  return (
    <SimpleAdminForm
      title="New Venue"
      endpoint="/api/admin/venues"
      method="POST"
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
