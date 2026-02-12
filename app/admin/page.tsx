import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <ul className="list-disc pl-6">
        <li><Link className="underline" href="/admin/events">Events</Link></li>
        <li><Link className="underline" href="/admin/venues">Venues</Link></li>
        <li><Link className="underline" href="/admin/artists">Artists</Link></li>
              <li><Link className="underline" href="/admin/submissions">Submissions</Link></li>
      </ul>
    </main>
  );
}
