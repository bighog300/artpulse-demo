"use client";

import { useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";

type Props = {
  targetType: "event" | "artist" | "venue";
  targetId: string;
  role: "featured" | "gallery";
  onUploaded: (url: string) => void;
  multiple?: boolean;
  mode?: "default" | "standalone";
  title?: string;
};

export default function AdminImageUpload({
  targetType,
  targetId,
  role,
  onUploaded,
  multiple = false,
  mode = "default",
  title,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => files.length === 0 || isUploading, [files, isUploading]);

  async function uploadFiles(nextFiles: File[]) {
    if (!nextFiles.length) return;
    setError(null);
    setProgress(0);
    setIsUploading(true);

    try {
      for (let index = 0; index < nextFiles.length; index += 1) {
        const file = nextFiles[index]!;
        const result = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob/upload",
          clientPayload: JSON.stringify({ targetType, targetId, role }),
          onUploadProgress: (event) => setProgress(((index + event.percentage / 100) / nextFiles.length) * 100),
        });
        onUploaded(result.url);
      }

      setFiles([]);
      setProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function onStartUpload() {
    await uploadFiles(files);
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <p className="text-sm font-medium">{title ?? `Upload image${multiple ? "s" : ""}`}</p>
      <input
        type="file"
        accept="image/*"
        multiple={multiple && mode === "default"}
        onChange={(event) => {
          const nextFiles = Array.from(event.target.files ?? []);
          setFiles(nextFiles);
          setError(null);
          setProgress(0);
          if (mode === "standalone") {
            void uploadFiles(nextFiles.slice(0, 1));
            event.currentTarget.value = "";
          }
        }}
      />
      {mode === "default" ? (
        <button type="button" className="rounded border px-3 py-1 text-sm disabled:opacity-50" disabled={disabled} onClick={() => void onStartUpload()}>
          {isUploading ? `Uploading ${Math.round(progress)}%` : `Upload${files.length > 1 ? ` (${files.length})` : ""}`}
        </button>
      ) : isUploading ? (
        <p className="text-xs text-muted-foreground">Uploading {Math.round(progress)}%</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
