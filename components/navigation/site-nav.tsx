import { getSessionUser } from "@/lib/auth";
import { SiteNavClient } from "@/components/navigation/site-nav-client";

export async function SiteNav() {
  const user = await getSessionUser();
  return <SiteNavClient isAuthenticated={Boolean(user)} />;
}
