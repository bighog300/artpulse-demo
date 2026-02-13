import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/app/account/logout-button";
import { db } from "@/lib/db";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { LocationSettings } from "@/app/account/location-settings";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="p-6">
        Please <Link className="underline" href="/login">login</Link>.
      </main>
    );
  }

  const [unreadCount, location] = await Promise.all([
    db.notification.count({ where: { userId: user.id, status: "UNREAD" } }),
    db.user.findUnique({
      where: { id: user.id },
      select: { locationLabel: true, locationLat: true, locationLng: true, locationRadiusKm: true },
    }),
  ]);

  return (
    <main className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <OnboardingPanel />
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <p><Link className="underline" href="/my/venues">Manage my venues</Link></p>
      <p><Link className="underline" href="/notifications">Notifications ({unreadCount})</Link></p>
      <LocationSettings
        initial={{
          locationLabel: location?.locationLabel ?? "",
          lat: location?.locationLat != null ? String(location.locationLat) : "",
          lng: location?.locationLng != null ? String(location.locationLng) : "",
          radiusKm: String(location?.locationRadiusKm ?? 25),
        }}
      />
      <LogoutButton />
    </main>
  );
}
