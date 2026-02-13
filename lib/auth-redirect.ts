import { redirect } from "next/navigation";

export function redirectToLogin(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}
