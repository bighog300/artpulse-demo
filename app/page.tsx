import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-3xl font-semibold">Artpulse</h1>
      <p>Discover published art events, artists, and venues.</p>
      <div className="space-x-3">
        <Link className="underline" href="/events">Events</Link>
        <Link className="underline" href="/venues">Venues</Link>
        <Link className="underline" href="/artists">Artists</Link>
        <Link className="underline" href="/calendar">Calendar</Link>
      </div>
    </main>
  );
}
