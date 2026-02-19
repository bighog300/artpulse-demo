import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8', className)}>{children}</div>;
}
