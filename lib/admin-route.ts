import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { apiError } from "@/lib/api";

/**
 * actorEmail is included to make it easy for admin routes to write audit logs via logAdminAction().
 */
type AdminRouteHandler<T> = (context: { email: string; actorEmail: string }) => Promise<T>;

export async function withAdminRoute<T>(handler: AdminRouteHandler<T>, deps: { requireAdminFn?: typeof requireAdmin } = {}) {
  try {
    const admin = await (deps.requireAdminFn ?? requireAdmin)({ redirectOnFail: false });
    return await handler({ ...admin, actorEmail: admin.email });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return apiError(error.status, error.status === 401 ? "unauthenticated" : "forbidden", error.message);
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
