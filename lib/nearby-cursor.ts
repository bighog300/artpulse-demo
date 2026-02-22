export type NearbyCursor = { id: string; startAt: Date };

export function encodeNearbyCursor(cursor: NearbyCursor) {
  return Buffer.from(`${cursor.startAt.toISOString()}|${cursor.id}`).toString("base64url");
}

export function decodeNearbyCursor(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf-8");
    const [startAtIso, id] = decoded.split("|");
    if (!startAtIso || !id) return null;
    const startAt = new Date(startAtIso);
    if (Number.isNaN(startAt.getTime())) return null;
    return { id, startAt };
  } catch {
    return null;
  }
}
