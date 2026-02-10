export function isSlug(v: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
}

export function isHttpUrl(v: string) {
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function toDate(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
