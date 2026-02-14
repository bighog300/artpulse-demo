import { z } from "zod";
import { normalizeAssociationRole, type AssociationRoleKey } from "@/lib/association-roles";

export const assocModeSchema = z.enum(["any", "verified", "exhibitions", "none"]).default("any");

export type AssocMode = z.infer<typeof assocModeSchema>;

const discoveryFiltersSchema = z.object({
  assoc: assocModeSchema.catch("any"),
  role: z.string().optional(),
});

type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function getParamValue(params: SearchParamsInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    const value = params.get(key);
    return value ?? undefined;
  }

  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export function parseDiscoveryFilters(searchParams: SearchParamsInput): { assoc: AssocMode; role?: AssociationRoleKey } {
  const parsed = discoveryFiltersSchema.parse({
    assoc: getParamValue(searchParams, "assoc"),
    role: getParamValue(searchParams, "role"),
  });

  if (parsed.assoc !== "verified") {
    return { assoc: parsed.assoc };
  }

  if (!parsed.role) {
    return { assoc: parsed.assoc };
  }

  return {
    assoc: parsed.assoc,
    role: normalizeAssociationRole(parsed.role),
  };
}
