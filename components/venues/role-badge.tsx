import { cn } from "@/lib/utils";

type VenueRoleBadge = "OWNER" | "EDITOR" | "MEMBER" | "ADMIN";

const roleStyles: Record<VenueRoleBadge, string> = {
  ADMIN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OWNER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EDITOR: "bg-blue-100 text-blue-800 border-blue-200",
  MEMBER: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const roleLabels: Record<VenueRoleBadge, string> = {
  ADMIN: "Admin",
  OWNER: "Admin",
  EDITOR: "Editor",
  MEMBER: "Member",
};

export function RoleBadge({ role, className }: { role: VenueRoleBadge; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", roleStyles[role], className)}>
      {roleLabels[role]}
    </span>
  );
}
