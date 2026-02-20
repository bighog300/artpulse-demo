import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/perf", label: "Performance" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/beta", label: "Beta" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Artpulse</p>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          <div className="text-sm text-muted-foreground">{admin.email}</div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-background p-3">
          <nav className="space-y-1" aria-label="Admin navigation">
            {ADMIN_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
