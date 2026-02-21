export const ARTWORK_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isArtworkIdKey(key: string) {
  return ARTWORK_UUID_REGEX.test(key);
}

export function shouldRedirectArtworkIdKey(key: string, slug: string | null | undefined) {
  return isArtworkIdKey(key) && Boolean(slug && slug !== key);
}
