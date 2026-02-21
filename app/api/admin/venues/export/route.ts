import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleAdminEntityExport } from "@/lib/admin-entities-route";

export async function GET(req: NextRequest) {
  return handleAdminEntityExport(req, "venues", { requireAdminUser: requireAdmin, appDb: db });
}
