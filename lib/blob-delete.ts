import { del } from "@vercel/blob";

const VERCEL_BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

export function isVercelBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export async function deleteBlobByUrl(url: string) {
  if (!isVercelBlobUrl(url)) return;
  await del(url);
}
