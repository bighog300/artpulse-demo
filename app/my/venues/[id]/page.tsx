import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import VenueSelfServeForm from "@/app/my/_components/VenueSelfServeForm";

export default async function MyVenueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId: user.id, venueId: id } }, include: { venue: true } });
  if (!membership) notFound();

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Edit Venue</h1>
      <VenueSelfServeForm venue={membership.venue} />
    </main>
  );
}
