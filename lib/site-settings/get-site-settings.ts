import { db } from "@/lib/db";

const SITE_SETTINGS_ID = "default";

export async function getSiteSettings() {
  const existing = await db.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    include: { logoAsset: true },
  });

  if (existing) return existing;

  return db.siteSettings.create({
    data: { id: SITE_SETTINGS_ID },
    include: { logoAsset: true },
  });
}
