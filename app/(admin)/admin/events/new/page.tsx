import { ADMIN_IMAGE_ALT_REQUIRED } from "@/lib/admin-policy";
import EventAdminForm from "@/app/(admin)/admin/_components/EventAdminForm";

export default function AdminNewEvent() {
  return <EventAdminForm title="New Event" endpoint="/api/admin/events" method="POST" initial={{ timezone: "UTC", tagSlugs: [], artistSlugs: [] }} altRequired={ADMIN_IMAGE_ALT_REQUIRED} />;
}
