"use client";

import { upload } from "@vercel/blob/client";

export type AdminUploadTargetType = "event" | "artist" | "venue";

export type UploadToBlobOptions = {
  targetType: AdminUploadTargetType;
  targetId: string;
  role: "featured" | "gallery";
  onUploadProgress?: (percentage: number) => void;
};

export type UploadToBlobResult = {
  url: string;
  pathname?: string;
  contentType: string;
  size: number;
};

export async function uploadToBlob(file: File, options: UploadToBlobOptions): Promise<UploadToBlobResult> {
  const result = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob/upload",
    clientPayload: JSON.stringify({ targetType: options.targetType, targetId: options.targetId, role: options.role }),
    onUploadProgress: options.onUploadProgress ? (event) => options.onUploadProgress?.(event.percentage) : undefined,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    contentType: file.type,
    size: file.size,
  };
}
