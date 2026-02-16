import type { ReactNode } from "react";

type InlineBannerProps = {
  children: ReactNode;
};

export function InlineBanner({ children }: InlineBannerProps) {
  return <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{children}</div>;
}
