const ROLE_LABELS = {
  represented_by: "Represented by",
  exhibited_at: "Exhibited at",
  resident_artist: "Resident artist",
  collaborator: "Collaborator",
  other: "Other",
} as const;

export const ASSOCIATION_ROLES = Object.keys(ROLE_LABELS) as AssociationRoleKey[];

export type AssociationRoleKey = keyof typeof ROLE_LABELS;

const ROLE_SYNONYMS: Record<string, AssociationRoleKey> = {
  represented: "represented_by",
  exhibition: "exhibited_at",
  resident: "resident_artist",
};

export const DEFAULT_ASSOCIATION_ROLE: AssociationRoleKey = "exhibited_at";

export function isRoleKey(value: unknown): value is AssociationRoleKey {
  return typeof value === "string" && ASSOCIATION_ROLES.includes(value as AssociationRoleKey);
}

export function normalizeAssociationRole(input: unknown): AssociationRoleKey {
  if (typeof input !== "string") return DEFAULT_ASSOCIATION_ROLE;

  const normalized = input.trim().toLowerCase();
  if (!normalized) return DEFAULT_ASSOCIATION_ROLE;

  if (isRoleKey(normalized)) return normalized;
  if (ROLE_SYNONYMS[normalized]) return ROLE_SYNONYMS[normalized];

  return "other";
}

export function roleLabel(roleKey: AssociationRoleKey): string {
  return ROLE_LABELS[roleKey] ?? ROLE_LABELS.other;
}

export function roleBadgeText(roleKey: AssociationRoleKey): string {
  return roleLabel(roleKey);
}
