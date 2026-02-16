"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNavItems } from "@/components/navigation/nav-config";

type SiteNavClientProps = {
  isAuthenticated: boolean;
};

const QUICK_ACTIONS = [
  { label: "For You", description: "Personalized picks", href: "/for-you" },
  { label: "Following", description: "From artists and venues you follow", href: "/following" },
  { label: "Find nearby", description: "Explore around you", href: "/nearby" },
  { label: "Save a search", description: "Save filters for alerts", href: "/search" },
  { label: "Saved searches", description: "Manage saved alerts", href: "/saved-searches" },
  { label: "Create venue", description: "Add a venue you manage", href: "/my/venues/new" },
  { label: "Invite members", description: "Invite your venue team", href: "/my/venues" },
  { label: "Notifications", description: "Review updates", href: "/notifications" },
  { label: "Preferences", description: "Tune personalization signals", href: "/preferences" },
] as const;

function NotificationLink({ unread }: { unread: number }) {
  return (
    <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/notifications">
      Notifications
      {unread > 0 ? <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-xs text-white">{unread}</span> : null}
    </Link>
  );
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItemLink({ href, label, onClick, className = "" }: { href: string; label: string; onClick?: () => void; className?: string }) {
  const pathname = usePathname() ?? "/";
  const isActive = isPathActive(pathname, href);

  return (
    <Link
      key={href}
      className={`text-sm ${isActive ? "font-medium text-zinc-900" : "text-zinc-700 hover:text-zinc-900"} ${className}`}
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function SiteNavClient({ isAuthenticated }: SiteNavClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);

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

    const onUnreadRefresh = () => {
      void loadUnread();
    };

    loadUnread();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("notifications:unread-refresh", onUnreadRefresh);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("notifications:unread-refresh", onUnreadRefresh);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isQuickActionsOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (quickActionsRef.current?.contains(target)) return;
      setIsQuickActionsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsQuickActionsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isQuickActionsOpen]);

  const items = getNavItems(isAuthenticated);
  const notificationOrAccountItems = items.filter((item) => item.href === "/notifications" || item.href === "/account");
  const otherItems = items.filter((item) => item.href !== "/notifications" && item.href !== "/account");

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link className="text-lg font-semibold" href="/">Artpulse</Link>

        <nav className="hidden items-center gap-4 md:flex">
          {otherItems.map((item) => (
            item.href === "/notifications" && isAuthenticated
              ? <NotificationLink key={item.href} unread={unread} />
              : <NavItemLink key={item.href} href={item.href} label={item.label} />
          ))}

          {isAuthenticated ? (
            <div className="relative" ref={quickActionsRef}>
              <button
                type="button"
                className="rounded border px-3 py-1.5 text-sm text-zinc-700 hover:text-zinc-900"
                aria-haspopup="menu"
                aria-expanded={isQuickActionsOpen}
                aria-controls="quick-actions-menu"
                onClick={() => setIsQuickActionsOpen((prev) => !prev)}
              >
                Quick Actions
              </button>
              {isQuickActionsOpen ? (
                <div id="quick-actions-menu" className="absolute right-0 top-10 z-20 w-72 rounded-md border bg-white p-2 shadow-lg" role="menu">
                  <p className="px-2 pb-2 text-xs text-zinc-500">Tip: Follow a venue/artist to personalize For You.</p>
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.href + action.label}
                      className="block rounded px-2 py-1.5 hover:bg-zinc-100"
                      href={action.href}
                      role="menuitem"
                      onClick={() => setIsQuickActionsOpen(false)}
                    >
                      <span className="block text-sm text-zinc-900">{action.label}</span>
                      <span className="block text-xs text-zinc-500">{action.description}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {notificationOrAccountItems.map((item) => (
            item.href === "/notifications" && isAuthenticated
              ? <NotificationLink key={item.href} unread={unread} />
              : <NavItemLink key={item.href} href={item.href} label={item.label} />
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
              : <NavItemLink key={item.href} href={item.href} label={item.label} className="block" onClick={() => setIsMobileOpen(false)} />
          ))}
          {isAuthenticated ? (
            <div className="mt-3 space-y-1 border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Quick actions</p>
              <p className="text-xs text-zinc-500">Tip: Follow a venue/artist to personalize For You.</p>
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={`mobile-${action.href}-${action.label}`}
                  className="block rounded px-1 py-1 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  href={action.href}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="block">{action.label}</span>
                  <span className="block text-xs text-zinc-500">{action.description}</span>
                </Link>
              ))}
            </div>
          ) : null}
          {isAuthenticated ? null : <Link className="inline-block rounded border px-3 py-1.5 text-sm" href="/login">Sign in</Link>}
        </nav>
      ) : null}
    </header>
  );
}
