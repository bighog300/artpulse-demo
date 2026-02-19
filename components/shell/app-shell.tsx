import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { AppShellNav } from "@/components/shell/app-shell-nav";

type AppShellProps = {
  user: SessionUser | null;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <>
      <AppShellNav user={user} />
      <main id="main" className="pb-20 md:pb-0">
        {children}
      </main>
    </>
  );
}
