import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleAdminBrandingLogoGet } from "@/lib/admin-branding-logo-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handleAdminBrandingLogoGet(req, { requireAdminUser: requireAdmin });
}
