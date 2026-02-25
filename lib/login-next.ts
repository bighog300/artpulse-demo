const DEFAULT_NEXT_PATH = "/";

export function sanitizeNextPath(nextPath: string | null | undefined, fallback: string = DEFAULT_NEXT_PATH) {
  if (!nextPath) return fallback;
  if (!nextPath.startsWith("/")) return fallback;
  if (nextPath.startsWith("//")) return fallback;
  if (nextPath.includes("\\")) return fallback;
  if (nextPath.includes("://")) return fallback;
  if (/^\/\s*javascript:/i.test(nextPath)) return fallback;
  return nextPath;
}
