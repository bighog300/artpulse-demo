import { notFound } from "next/navigation";
import AdminEntityForm from "@/app/(admin)/admin/_components/AdminEntityForm";
import { db } from "@/lib/db";

export default async function AdminVenue({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await db.venue.findUnique({ where: { id } });
  if (!venue) notFound();

  return (
    <AdminEntityForm
      title="Edit Venue"
      endpoint={`/api/admin/venues/${id}`}
      method="PATCH"
      redirectPath="/admin/venues"
      uploadTargetType="venue"
      uploadTargetId={id}
      initial={venue}
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
