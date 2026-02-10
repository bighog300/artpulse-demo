import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/app/account/logout-button";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="p-6">
        Please <Link className="underline" href="/login">login</Link>.
      </main>
    );
  }

  return (
    <main className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <LogoutButton />
    </main>
  );
}
