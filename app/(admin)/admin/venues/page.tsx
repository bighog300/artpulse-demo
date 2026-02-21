import { requireAdmin } from "@/lib/admin";
import { AdminEntityManagerClient } from "../admin-entity-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminVenues() {
  await requireAdmin();
  return <AdminEntityManagerClient entity="venues" title="Manage Venues" fields={["name", "slug", "addressLine1", "addressLine2", "city", "postcode", "country", "websiteUrl", "isPublished", "description", "featuredAssetId"]} defaultMatchBy="slug" />;
}
