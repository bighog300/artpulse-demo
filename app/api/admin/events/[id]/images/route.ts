import { apiError } from "@/lib/api";
import { withAdminRoute } from "@/lib/admin-route";
import { addAdminEntityImage, getAdminEntityImages } from "@/lib/admin-entity-images-route";
import { adminEntityImageCreateSchema, idParamSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminRoute(async () => {
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    return getAdminEntityImages("event", parsedId.data.id);
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminRoute(async ({ actorEmail }) => {
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    const parsedBody = adminEntityImageCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    return addAdminEntityImage({ entityType: "event", entityId: parsedId.data.id, actorEmail, req, ...parsedBody.data });
  });
}
