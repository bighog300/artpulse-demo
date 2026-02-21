import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleImportMappingPresetList, handleImportMappingPresetSave } from "@/lib/admin-import-mapping-presets-route";

export async function GET(req: NextRequest) {
  return handleImportMappingPresetList(req, { requireAdminUser: requireAdmin, appDb: db });
}

export async function POST(req: NextRequest) {
  return handleImportMappingPresetSave(req, { requireAdminUser: requireAdmin, appDb: db });
}
