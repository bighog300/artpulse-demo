import type { ReactNode } from "react";

type CardGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
};

const columnsClass: Record<NonNullable<CardGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
};

export function CardGrid({ children, columns = 3 }: CardGridProps) {
  return <div className={`grid gap-4 ${columnsClass[columns]}`}>{children}</div>;
}
