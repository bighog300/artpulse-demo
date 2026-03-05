import { handleAdminSettingsGet, handleAdminSettingsPatch } from "@/lib/admin-settings-route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleAdminSettingsGet(req);
}

export async function PATCH(req: Request) {
  return handleAdminSettingsPatch(req);
}
