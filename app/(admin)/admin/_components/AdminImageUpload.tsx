"use client";

import { useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";

type Props = {
  targetType: "event" | "artist" | "venue";
  targetId: string;
  role: "featured" | "gallery";
  onUploaded: (url: string) => void;
};

export default function AdminImageUpload({ targetType, targetId, role, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => !file || isUploading, [file, isUploading]);

  async function onStartUpload() {
    if (!file) return;
    setError(null);
    setProgress(0);
    setIsUploading(true);

    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob/upload",
        clientPayload: JSON.stringify({ targetType, targetId, role }),
        onUploadProgress: (event) => setProgress(event.percentage),
      });

      onUploaded(result.url);
      setFile(null);
      setProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <p className="text-sm font-medium">Upload image</p>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          setFile(nextFile);
          setError(null);
          setProgress(0);
        }}
      />
      <button type="button" className="rounded border px-3 py-1 text-sm disabled:opacity-50" disabled={disabled} onClick={onStartUpload}>
        {isUploading ? `Uploading ${Math.round(progress)}%` : "Upload"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
