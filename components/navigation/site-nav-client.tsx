"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNavItems } from "@/components/navigation/nav-config";

type SiteNavClientProps = {
  isAuthenticated: boolean;
};

function NotificationLink({ unread }: { unread: number }) {
  return (
    <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/notifications">
      Notifications
      {unread > 0 ? <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-xs text-white">{unread}</span> : null}
    </Link>
  );
}

export function SiteNavClient({ isAuthenticated }: SiteNavClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const loadUnread = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as { unread?: number };
        setUnread(typeof data.unread === "number" ? data.unread : 0);
      } catch {
        // no-op
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") loadUnread();
    };

    loadUnread();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated]);

  const items = getNavItems(isAuthenticated);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link className="text-lg font-semibold" href="/">Artpulse</Link>

        <nav className="hidden items-center gap-4 md:flex">
          {items.map((item) => (
            item.href === "/notifications" && isAuthenticated
              ? <NotificationLink key={item.href} unread={unread} />
              : <Link key={item.href} className="text-sm text-zinc-700 hover:text-zinc-900" href={item.href}>{item.label}</Link>
          ))}
          {isAuthenticated ? null : <Link className="rounded border px-3 py-1.5 text-sm" href="/login">Sign in</Link>}
        </nav>

        <button
          type="button"
          className="rounded border px-3 py-1 text-sm md:hidden"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-nav-menu"
        >
          Menu
        </button>
      </div>

      {isMobileOpen ? (
        <nav id="mobile-nav-menu" className="space-y-2 border-t px-4 py-3 md:hidden">
          {items.map((item) => (
            item.href === "/notifications" && isAuthenticated
              ? <div key={item.href}><NotificationLink unread={unread} /></div>
              : <Link key={item.href} className="block text-sm text-zinc-700 hover:text-zinc-900" href={item.href} onClick={() => setIsMobileOpen(false)}>{item.label}</Link>
          ))}
          {isAuthenticated ? null : <Link className="inline-block rounded border px-3 py-1.5 text-sm" href="/login">Sign in</Link>}
        </nav>
      ) : null}
    </header>
  );
}
