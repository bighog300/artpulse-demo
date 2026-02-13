import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

type EmptyStateAction = {
  label: string;
  href: string;
  variant?: "default" | "secondary";
};

type EmptyStateProps = {
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  children?: ReactNode;
};

export function EmptyState({ title, description, actions = [], children }: EmptyStateProps) {
  return (
    <section className="rounded-lg border bg-zinc-50 p-5">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-zinc-600">{description}</p> : null}
      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className={buttonVariants({ variant: action.variant === "secondary" ? "outline" : "default", size: "sm" })}
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

