import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        <li>
          <Link className="rounded px-1 py-0.5 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">Home</Link>
        </li>
        {items.map((item) => (
          <li key={`${item.href}:${item.label}`} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            <Link className="rounded px-1 py-0.5 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
