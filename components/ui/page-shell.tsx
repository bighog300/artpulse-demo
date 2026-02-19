import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageShellProps = {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<'div'>;

export function PageShell({ children, className, ...props }: PageShellProps) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8', className)} {...props}>{children}</div>;
}
