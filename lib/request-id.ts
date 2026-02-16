export const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(headersLike: { get(name: string): string | null | undefined }) {
  return headersLike.get(REQUEST_ID_HEADER) || crypto.randomUUID();
}
