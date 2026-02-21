import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleAdminEntityImportPreview } from "@/lib/admin-entities-route";

export async function POST(req: NextRequest) {
  return handleAdminEntityImportPreview(req, "venues", { requireAdminUser: requireAdmin, appDb: db });
}
