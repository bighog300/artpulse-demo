import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "EDITOR" && user.role !== "ADMIN")) redirectToLogin("/admin");
  return <>{children}</>;
}
