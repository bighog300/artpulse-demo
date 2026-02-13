import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import CreateVenueForm from "@/app/my/_components/CreateVenueForm";

export default async function CreateVenuePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Create venue</h1>
      <p className="text-sm text-zinc-700">Create a draft venue profile and continue editing it from your venue dashboard.</p>
      <CreateVenueForm />
    </main>
  );
}
