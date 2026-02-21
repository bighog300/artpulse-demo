import { requireAdmin } from "@/lib/admin";
import { AdminEntityManagerClient } from "../admin-entity-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminArtists() {
  await requireAdmin();
  return <AdminEntityManagerClient entity="artists" title="Manage Artists" fields={["name", "websiteUrl", "bio", "featuredAssetId", "isPublished"]} defaultMatchBy="id" />;
}
