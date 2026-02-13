import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

type Deps = {
  requireAuth: typeof requireAuth;
  countUnread: (userId: string) => Promise<number>;
};

export async function unreadCountResponse(deps: Deps) {
  let user;
  try {
    user = await deps.requireAuth();
  } catch {
    return apiError(401, "unauthorized", "Authentication required");
  }

  const unread = await deps.countUnread(user.id);
  return NextResponse.json({ unread });
}

export function defaultUnreadCountDeps(): Deps {
  return {
    requireAuth,
    countUnread: async (userId) => {
      if (!hasDatabaseUrl()) return 0;
      return db.notification.count({ where: { userId, status: "UNREAD" } });
    },
  };
}
