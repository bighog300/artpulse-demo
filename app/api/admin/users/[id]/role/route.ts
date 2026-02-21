import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleAdminUserRoleUpdate } from "@/lib/admin-users-route";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleAdminUserRoleUpdate(req, params, {
    requireAdminUser: requireAdmin,
    appDb: db,
  });
}
