import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleImportMappingPresetDelete, handleImportMappingPresetGet } from "@/lib/admin-import-mapping-presets-route";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleImportMappingPresetGet(req, await context.params, { requireAdminUser: requireAdmin, appDb: db });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleImportMappingPresetDelete(req, await context.params, { requireAdminUser: requireAdmin, appDb: db });
}
