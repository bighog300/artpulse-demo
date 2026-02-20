import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { db } from "@/lib/db";

type AdminUploadTokenPayload = {
  actorEmail: string;
  actorId: string;
  targetType: "event" | "artist" | "venue";
  targetId: string;
  role: "featured" | "gallery";
};

type BlobUploadResult = { url: string; pathname: string; contentType?: string; size?: number };

export async function handleAdminBlobUpload(request: Request, body: HandleUploadBody, deps?: {
  requireAdminUser?: () => Promise<{ id: string; email: string | null }>;
  handleUploadFn?: typeof handleUpload;
}) {
  const requireAdminUser = deps?.requireAdminUser ?? (await import("@/lib/auth")).requireAdmin;
  const handleUploadFn = deps?.handleUploadFn ?? handleUpload;

  return handleUploadFn({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const admin = await requireAdminUser();
      const parsedPayload = parseUploadPayload(clientPayload);
      const payload: AdminUploadTokenPayload = {
        actorEmail: admin.email ?? "",
        actorId: admin.id,
        targetType: parsedPayload.targetType,
        targetId: parsedPayload.targetId,
        role: parsedPayload.role,
      };

      return {
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        addRandomSuffix: true,
        tokenPayload: JSON.stringify(payload),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const payload = parseTokenPayload(tokenPayload);
      const blobUpload = blob as unknown as BlobUploadResult;
      try {
        await db.asset.create({
          data: {
            ownerUserId: payload.actorId,
            kind: "IMAGE",
            url: blobUpload.url,
            filename: blobUpload.pathname,
            mime: blobUpload.contentType ?? null,
            sizeBytes: blobUpload.size ?? null,
          },
        });
      } catch {
        throw new Error("asset_create_failed");
      }
    },
  });
}

function parseUploadPayload(clientPayload: string | null) {
  const parsed = JSON.parse(clientPayload ?? "{}") as Partial<AdminUploadTokenPayload>;
  if (!parsed.targetType || !parsed.targetId || !parsed.role) throw new Error("invalid_upload_payload");
  return {
    targetType: parsed.targetType,
    targetId: parsed.targetId,
    role: parsed.role,
  } as Pick<AdminUploadTokenPayload, "targetType" | "targetId" | "role">;
}

function parseTokenPayload(tokenPayload: string | null | undefined): AdminUploadTokenPayload {
  const parsed = JSON.parse(tokenPayload ?? "{}") as Partial<AdminUploadTokenPayload>;
  if (!parsed.actorId || !parsed.targetType || !parsed.targetId || !parsed.role) {
    throw new Error("invalid_token_payload");
  }
  return {
    actorEmail: parsed.actorEmail ?? "",
    actorId: parsed.actorId,
    targetType: parsed.targetType,
    targetId: parsed.targetId,
    role: parsed.role,
  };
}

