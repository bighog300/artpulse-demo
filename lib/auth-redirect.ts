import { redirect } from "next/navigation";

export function buildLoginRedirectUrl(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function redirectToLogin(nextPath: string): never {
  redirect(buildLoginRedirectUrl(nextPath));
}
