import { apiError } from "@/lib/api";
import { withAdminRoute } from "@/lib/admin-route";
import { reorderAdminEntityImages } from "@/lib/admin-entity-images-route";
import { adminEntityImageReorderSchema, idParamSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminRoute(async ({ actorEmail }) => {
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    const parsedBody = adminEntityImageReorderSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    return reorderAdminEntityImages({ entityType: "artist", entityId: parsedId.data.id, order: parsedBody.data.order, actorEmail, req });
  });
}
