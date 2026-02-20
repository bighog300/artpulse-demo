"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ASSOCIATION_ROLES, roleLabel, type AssociationRoleKey } from "@/lib/association-roles";
import type { AssocCounts, RoleCounts } from "@/lib/discovery-counts";
import type { AssocMode } from "@/lib/discovery-filters";

type DiscoveryFilterBarProps = {
  assoc: AssocMode;
  role?: AssociationRoleKey;
  assocCounts?: AssocCounts;
  roleCounts?: RoleCounts;
};

const ASSOC_OPTIONS: Array<{ value: AssocMode; label: string }> = [
  { value: "any", label: "Any" },
  { value: "verified", label: "Verified" },
  { value: "exhibitions", label: "Exhibitions" },
  { value: "none", label: "None" },
];

function withCount(label: string, count?: number): string {
  return typeof count === "number" ? `${label} (${count})` : label;
}

export function DiscoveryFilterBar({ assoc, role, assocCounts, roleCounts }: DiscoveryFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <section className="rounded border p-3 space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium">Association filter</p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Association filter">
          {ASSOC_OPTIONS.map((option) => {
            const isActive = assoc === option.value;
            const count = assocCounts?.[option.value];

            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`rounded-full border px-3 py-1 text-sm transition ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground"}`}
                onClick={() => setFilters(option.value, option.value === "verified" ? role : undefined)}
              >
                {withCount(option.label, count)}
              </button>
            );
          })}
        </div>
      </div>

      {assoc === "verified" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Role</p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Verified role filter">
            <button
              type="button"
              role="tab"
              aria-selected={!role}
              className={`rounded-full border px-3 py-1 text-sm transition ${!role ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground"}`}
              onClick={() => setFilters("verified", undefined)}
            >
              {withCount("All roles", roleCounts?.all ?? assocCounts?.verified)}
            </button>

            {ASSOCIATION_ROLES.filter((roleKey) => (roleCounts?.[roleKey] ?? 0) > 0 || !roleCounts).map((roleKey) => {
              const isActive = role === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-full border px-3 py-1 text-sm transition ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground"}`}
                  onClick={() => setFilters("verified", roleKey)}
                >
                  {withCount(roleLabel(roleKey), roleCounts?.[roleKey])}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
