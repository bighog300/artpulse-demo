import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleAdminUsersSearch } from "@/lib/admin-users-route";

export async function GET(req: NextRequest) {
  return handleAdminUsersSearch(req, {
    requireAdminUser: requireAdmin,
    appDb: db,
  });
}
