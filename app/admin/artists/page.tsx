import Link from "next/link";
export default function AdminArtists() { return <main className="p-6"><h1 className="text-2xl font-semibold">Manage Artists</h1><Link className="underline" href="/admin/artists/new">New Artist</Link></main>; }
