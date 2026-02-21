import { requireAdmin } from "@/lib/admin";
import { AdminEntityManagerClient } from "../admin-entity-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminEvents() {
  await requireAdmin();
  return <AdminEntityManagerClient entity="events" title="Manage Events" fields={["title", "startAt", "endAt", "venueId", "ticketUrl", "isPublished"]} defaultMatchBy="id" />;
}
