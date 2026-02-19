import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateAction = {
  label: string;
  href: string;
  variant?: 'default' | 'secondary';
};

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: string;
  description?: string;
  actions?: EmptyStateAction[];
  children?: ReactNode;
};

export function EmptyState({ icon, title, body, description, actions = [], children }: EmptyStateProps) {
  const text = body ?? description;

  return (
    <section className="rounded-xl border border-border bg-card p-5 text-card-foreground">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {text ? <p className="mt-2 text-sm text-muted-foreground">{text}</p> : null}
      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className={cn(buttonVariants({ variant: action.variant === 'secondary' ? 'secondary' : 'default', size: 'sm' }))}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
