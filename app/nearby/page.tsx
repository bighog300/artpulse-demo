import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { NearbyClient } from "@/app/nearby/nearby-client";

export default async function NearbyPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">Nearby events</h1>
        <p>Set DATABASE_URL to view nearby events locally.</p>
      </main>
    );
  }

  const user = await getSessionUser();
  const location = user
    ? await db.user.findUnique({
      where: { id: user.id },
      select: { locationLabel: true, locationLat: true, locationLng: true, locationRadiusKm: true },
    })
    : null;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Nearby events</h1>
      <p className="text-sm text-gray-700">
        Set your location to discover published events happening near you. {user ? <Link className="underline" href="/account">Manage on account settings</Link> : <Link className="underline" href="/login">Login</Link>} to save this preference.
      </p>
      <NearbyClient
        isAuthenticated={Boolean(user)}
        initialLocation={{
          locationLabel: location?.locationLabel ?? "",
          lat: location?.locationLat != null ? String(location.locationLat) : "",
          lng: location?.locationLng != null ? String(location.locationLng) : "",
          radiusKm: String(location?.locationRadiusKm ?? 25),
        }}
      />
    </main>
  );
}
