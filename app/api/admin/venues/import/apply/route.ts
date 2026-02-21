import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleAdminEntityImportApply } from "@/lib/admin-entities-route";

export async function POST(req: NextRequest) {
  return handleAdminEntityImportApply(req, "venues", { requireAdminUser: requireAdmin, appDb: db });
}
