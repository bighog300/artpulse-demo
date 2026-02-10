import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return <main className="p-6">Please <Link className="underline" href="/login">login</Link>.</main>;
  }

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <form action="/api/auth/logout" method="post">
        <button className="rounded border px-3 py-1" type="submit">Logout</button>
      </form>
    </main>
  );
}
