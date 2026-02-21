"use client";

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_MIN_DIMENSION = 200;
export const IMAGE_MAX_DIMENSION = 8000;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageValidationResult = { ok: true } | { ok: false; reason: string };

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = () => reject(new Error("invalid_image"));
      image.src = objectUrl;
    });
    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, reason: "Only JPEG, PNG, and WEBP images are allowed." };
  }

  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, reason: `Image exceeds ${Math.round(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024))}MB limit.` };
  }

  try {
    const { width, height } = await readImageDimensions(file);
    if (width < IMAGE_MIN_DIMENSION || height < IMAGE_MIN_DIMENSION) {
      return { ok: false, reason: `Image dimensions must be at least ${IMAGE_MIN_DIMENSION}px by ${IMAGE_MIN_DIMENSION}px.` };
    }
    if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
      return { ok: false, reason: `Image dimensions must be no larger than ${IMAGE_MAX_DIMENSION}px by ${IMAGE_MAX_DIMENSION}px.` };
    }
  } catch {
    return { ok: false, reason: "Unable to read image dimensions." };
  }

  return { ok: true };
}
