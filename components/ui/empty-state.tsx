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
    <section className="section-stack rounded-xl border border-border bg-card p-6 text-card-foreground">
      {icon ? <div className="text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div> : null}
      <div className="section-stack">
        <h2 className="type-h3">{title}</h2>
        {text ? <p className="type-caption max-w-2xl">{text}</p> : null}
      </div>
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
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
      {children ? <div className="section-stack">{children}</div> : null}
    </section>
  );
}
