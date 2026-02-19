import Link from 'next/link';

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, href, linkLabel = 'See all' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="type-h3">{title}</h2>
      {href ? (
        <Link href={href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
