import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { curatedCollectionHomeOrderSchema, parseBody, zodDetails } from "@/lib/validators";

type BeforeRow = { id: string; homeRank: number | null };
type AfterRow = { id: string; title?: string; homeRank: number | null; showOnHome?: boolean; updatedAt?: Date };

type Deps = {
  requireAdminUser: () => Promise<{ email?: string }>;
  getBefore: (orderedIds: string[]) => Promise<BeforeRow[]>;
  updateOrder: (orderedIds: string[], resetOthers?: boolean) => Promise<void>;
  getAfter: (orderedIds: string[]) => Promise<AfterRow[]>;
  logAction: (args: { actorEmail: string; before: BeforeRow[]; after: Array<{ id: string; homeRank: number | null }>; req: NextRequest }) => Promise<void>;
};

export async function handleAdminCurationHomeOrder(req: NextRequest, deps: Deps) {
  try {
    const admin = await deps.requireAdminUser();
    const parsed = curatedCollectionHomeOrderSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));

    const { orderedIds, resetOthers } = parsed.data;
    const before = await deps.getBefore(orderedIds);
    await deps.updateOrder(orderedIds, resetOthers);
    const collections = await deps.getAfter(orderedIds);
    await deps.logAction({ actorEmail: admin.email ?? "unknown", before, after: collections.map((c) => ({ id: c.id, homeRank: c.homeRank })), req });
    return NextResponse.json({ collections });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
