import { apiError } from "@/lib/api";
import { withAdminRoute } from "@/lib/admin-route";
import { deleteAdminEntityImage, patchAdminEntityImage } from "@/lib/admin-entity-images-route";
import { adminEntityImagePatchSchema, idParamSchema, imageIdParamSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  return withAdminRoute(async ({ actorEmail }) => {
    const routeParams = await params;
    const parsedId = idParamSchema.safeParse({ id: routeParams.id });
    const parsedImageId = imageIdParamSchema.safeParse({ imageId: routeParams.imageId });
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    if (!parsedImageId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedImageId.error));

    const parsedBody = adminEntityImagePatchSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    return patchAdminEntityImage({ entityType: "event", entityId: parsedId.data.id, imageId: parsedImageId.data.imageId, actorEmail, req, ...parsedBody.data });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  return withAdminRoute(async ({ actorEmail }) => {
    const routeParams = await params;
    const parsedId = idParamSchema.safeParse({ id: routeParams.id });
    const parsedImageId = imageIdParamSchema.safeParse({ imageId: routeParams.imageId });
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    if (!parsedImageId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedImageId.error));

    return deleteAdminEntityImage({ entityType: "event", entityId: parsedId.data.id, imageId: parsedImageId.data.imageId, actorEmail, req });
  });
}
