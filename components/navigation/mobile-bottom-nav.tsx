"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Home, MapPin, Sparkles, Users, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  isAuthenticated: boolean;
};

type MobileBottomNavInnerProps = MobileBottomNavProps & { pathname: string };

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/nearby", label: "Nearby", icon: MapPin },
  { href: "/for-you", label: "For You", icon: Sparkles },
  { href: "/following", label: "Following", icon: Users },
  { href: "/account", label: "Account", icon: UserCircle },
] as const;

export function MobileBottomNavInner({ isAuthenticated, pathname }: MobileBottomNavInnerProps) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as { unread?: number };
        setUnread(typeof data.unread === "number" ? data.unread : 0);
      } catch {
        // noop
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const onUnreadRefresh = () => {
      void load();
    };
    void load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("notifications:unread-refresh", onUnreadRefresh);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("notifications:unread-refresh", onUnreadRefresh);
    };
  }, [isAuthenticated]);

  const visibleItems = useMemo(
    () => isAuthenticated ? ITEMS : ITEMS.filter((item) => item.href === "/" || item.href === "/nearby"),
    [isAuthenticated],
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white md:hidden" aria-label="Mobile navigation">
      <ul className="grid grid-cols-5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 px-2 py-2 text-[11px] text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-zinc-500"}`} aria-hidden="true" />
                <span>{item.label}</span>
                {item.href === "/account" && unread > 0 ? <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-red-500" aria-label="Unread notifications" /> : null}
              </Link>
            </li>
          );
        })}
        {!isAuthenticated ? (
          <li>
            <Link href="/login" className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] text-zinc-700" aria-label="Sign in">
              <UserCircle className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              <span>Sign in</span>
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

export function MobileBottomNav({ isAuthenticated }: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";
  return <MobileBottomNavInner isAuthenticated={isAuthenticated} pathname={pathname} />;
}
