import { db } from "@/lib/db";

const SITE_SETTINGS_ID = "default";

export async function updateSiteSettings(data: {
  ingestSystemPrompt?: string | null;
  ingestModel?: string | null;
  ingestMaxOutputTokens?: number | null;
}) {
  return db.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...data },
    update: data,
  });
}
