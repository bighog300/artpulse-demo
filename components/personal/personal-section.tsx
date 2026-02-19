import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";

type PersonalSectionProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PersonalSection({ title, description, href, linkLabel, actions, children }: PersonalSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <SectionHeader title={title} href={href} linkLabel={linkLabel} />
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
