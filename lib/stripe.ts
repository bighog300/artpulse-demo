import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

let cachedSecretKey: string | null = null;
let cachedClient: unknown | null = null;

export async function getStripeClient() {
  const settings = await getSiteSettings();
  const stripeSecretKey = settings.stripeSecretKey?.trim();
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key is not configured in SiteSettings");
  }

  if (cachedClient && cachedSecretKey === stripeSecretKey) {
    return cachedClient as any;
  }

  const stripeModule = await import("stripe");
  const Stripe = stripeModule.default;
  cachedSecretKey = stripeSecretKey;
  cachedClient = new Stripe(stripeSecretKey);
  return cachedClient as any;
}
