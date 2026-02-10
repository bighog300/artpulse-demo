import SimpleAdminForm from "@/app/admin/_components/SimpleAdminForm";

export default function AdminNewVenue() {
  return (
    <SimpleAdminForm
      title="New Venue"
      endpoint="/api/admin/venues"
      method="POST"
      initial={{ name: "", slug: "", description: "", city: "", country: "", lat: "", lng: "", websiteUrl: "", instagramUrl: "", contactEmail: "", isPublished: false }}
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
      ]}
    />
  );
}
