import { put } from "@vercel/blob";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error("invalid_mime");
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("file_too_large");
  }
}

export async function uploadImageAsset(params: {
  file: File;
  ownerUserId: string;
  alt?: string | null;
  uploadToBlob?: typeof put;
  dbClient: {
    asset: {
      create: (args: {
        data: {
          ownerUserId: string;
          kind: "IMAGE";
          url: string;
          filename: string | null;
          mime: string | null;
          sizeBytes: number;
          alt: string | null;
        };
        select: { id: true; url: true };
      }) => Promise<{ id: string; url: string }>;
    };
  };
}) {
  const { file, ownerUserId, alt, uploadToBlob = put, dbClient } = params;
  validateImageFile(file);

  const blob = await uploadToBlob(`uploads/${ownerUserId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const asset = await dbClient.asset.create({
    data: {
      ownerUserId,
      kind: "IMAGE",
      url: blob.url,
      filename: file.name || null,
      mime: file.type || null,
      sizeBytes: file.size,
      alt: alt ?? null,
    },
    select: { id: true, url: true },
  });

  return { assetId: asset.id, url: asset.url };
}

export function resolveImageUrl(assetUrl: string | null | undefined, legacyUrl: string | null | undefined) {
  return assetUrl || legacyUrl || null;
}
