import Link from 'next/link';
import type { ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
};

export function SectionHeader({ title, subtitle, href, linkLabel = 'See all', actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="section-stack">
        <h2 className="type-h3">{title}</h2>
        {subtitle ? <p className="type-caption">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {href ? (
          <Link href={href} className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
