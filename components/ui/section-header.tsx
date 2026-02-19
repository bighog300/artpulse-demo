import Link from 'next/link';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, subtitle, href, linkLabel = 'See all' }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="type-h3">{title}</h2>
        {subtitle ? <p className="type-caption">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
