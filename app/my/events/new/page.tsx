import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { NewEventAutoCreate } from "@/app/my/events/new/page-client";

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/events/new");

  const memberships = await db.venueMembership.findMany({
    where: { userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
    select: { venueId: true },
  });

  const now = new Date();
  const startAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  return (
    <main className="p-6">
      <NewEventAutoCreate
        defaultPayload={{
          title: "Untitled event",
          startAt,
          endAt,
          venueId: memberships.length === 1 ? memberships[0]!.venueId : undefined,
          timezone: "UTC",
        }}
      />
    </main>
  );
}
