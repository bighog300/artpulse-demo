import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyVenuesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = await db.venueMembership.findMany({
    where: { userId: user.id },
    include: { venue: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">My Venues</h1>
      <ul className="space-y-2">
        {memberships.map((item) => (
          <li key={item.id} className="border rounded p-3">
            <div className="font-medium">{item.venue.name}</div>
            <div className="text-sm text-neutral-600">Role: {item.role}</div>
            <div className="text-sm mt-2 space-x-3">
              <Link className="underline" href={`/my/venues/${item.venue.id}`}>Edit profile</Link>
              <Link className="underline" href={`/my/venues/${item.venue.id}/submit-event`}>Submit event</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
