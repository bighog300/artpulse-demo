import { headers } from "next/headers";

export async function getServerBaseUrl(): Promise<string> {
  const h = await headers();

  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  const host =
    h.get("x-forwarded-host") ??
    h.get("host");

  if (!host) {
    throw new Error("Cannot determine host for internal fetch");
  }

  return `${proto}://${host}`;
}
