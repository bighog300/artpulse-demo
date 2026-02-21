"use client";

import Image from "next/image";
import { useState } from "react";

type UploadResult = { assetId: string; url: string };

export default function ImageUploader({
  label,
  onUploaded,
  initialUrl,
  onRemove,
}: {
  label: string;
  onUploaded: (result: UploadResult) => void;
  initialUrl?: string | null;
  onRemove?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "Upload failed");
      }

      const data = (await res.json()) as UploadResult;
      setPreviewUrl(data.url);
      onUploaded(data);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage() {
    if (!onRemove || !window.confirm("Remove current image?")) return;
    onRemove();
    setPreviewUrl(null);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
      {isUploading ? <p className="text-xs text-gray-600">Uploading...</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {previewUrl ? (
        <>
          <div className="relative h-32 w-32 overflow-hidden rounded border">
            <Image src={previewUrl} alt="Preview" fill sizes="128px" className="object-cover" />
          </div>
          {onRemove ? <button type="button" className="rounded border px-2 py-1 text-sm text-red-700" onClick={removeImage}>Remove image</button> : null}
        </>
      ) : null}
    </div>
  );
}
