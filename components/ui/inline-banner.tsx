import type { ReactNode } from "react";

type InlineBannerProps = {
  children: ReactNode;
};

export function InlineBanner({ children }: InlineBannerProps) {
  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
