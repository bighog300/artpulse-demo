import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
};

export function PageHeader({ title, subtitle, actions, tabs }: PageHeaderProps) {
  return (
    <header className="space-y-3 border-b border-zinc-200 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {tabs ? <div>{tabs}</div> : null}
    </header>
  );
}
