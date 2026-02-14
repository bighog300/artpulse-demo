"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ASSOCIATION_ROLES, roleLabel, type AssociationRoleKey } from "@/lib/association-roles";
import type { AssocMode } from "@/lib/discovery-filters";

type DiscoveryFilterBarProps = {
  assoc: AssocMode;
  role?: AssociationRoleKey;
};

const ASSOC_OPTIONS: Array<{ value: AssocMode; label: string }> = [
  { value: "any", label: "Any association state" },
  { value: "verified", label: "Verified associations" },
  { value: "exhibitions", label: "From exhibitions" },
  { value: "none", label: "No associations" },
];

export function DiscoveryFilterBar({ assoc, role }: DiscoveryFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const roleOptions = useMemo(() => ASSOCIATION_ROLES.map((key) => ({ value: key, label: roleLabel(key) })), []);

  const setFilters = (nextAssoc: AssocMode, nextRole?: AssociationRoleKey) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (nextAssoc === "any") {
      params.delete("assoc");
    } else {
      params.set("assoc", nextAssoc);
    }

    if (nextAssoc === "verified" && nextRole) {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return (
    <section className="rounded border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Association filter</span>
          <select className="rounded border p-2" value={assoc} onChange={(event) => setFilters(event.target.value as AssocMode, role)}>
            {ASSOC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {assoc === "verified" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Role</span>
            <select
              className="rounded border p-2"
              value={role ?? ""}
              onChange={(event) => {
                const selected = event.target.value;
                setFilters("verified", selected ? (selected as AssociationRoleKey) : undefined);
              }}
            >
              <option value="">All roles</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
