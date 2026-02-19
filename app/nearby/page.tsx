import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { NearbyClient } from "@/app/nearby/nearby-client";
import { resolveNearbyView } from "@/lib/nearby-map";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default async function NearbyPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="page-stack">
        <PageHeader title="Nearby events" subtitle="Upcoming events near your saved location." />
        <p>Set DATABASE_URL to view nearby events locally.</p>
      </PageShell>
    );
  }

  const user = await getSessionUser();
  const location = user
    ? await db.user.findUnique({
      where: { id: user.id },
      select: { locationLabel: true, locationLat: true, locationLng: true, locationRadiusKm: true },
    })
    : null;

  const query = await searchParams;

  return (
    <PageShell className="page-stack">
      <PageHeader title="Nearby events" subtitle="Upcoming events near your saved location." />
      <p className="type-caption">
        Set your location to discover published events happening near you. {user ? <Link className="underline" href="/account">Refine search</Link> : <Link className="underline" href="/login">Login</Link>} to save this preference.
      </p>
      <NearbyClient
        isAuthenticated={Boolean(user)}
        initialView={resolveNearbyView(query.view)}
        initialLocation={{
          locationLabel: location?.locationLabel ?? "",
          lat: location?.locationLat != null ? String(location.locationLat) : "",
          lng: location?.locationLng != null ? String(location.locationLng) : "",
          radiusKm: String(location?.locationRadiusKm ?? 25),
        }}
      />
    </PageShell>
  );
}
