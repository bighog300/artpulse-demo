import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleTrackPageView } from "@/lib/page-view-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleTrackPageView(req, {
    getSessionUser,
    createEvent: async (input) => {
      await db.pageViewEvent.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          day: input.day,
          viewerHash: input.viewerHash,
          userId: input.userId,
        },
      });
    },
    incrementDaily: async (input) => {
      await db.$executeRaw(
        Prisma.sql`INSERT INTO "PageViewDaily" ("id", "entityType", "entityId", "day", "views")
                   VALUES (gen_random_uuid(), ${input.entityType}::"AnalyticsEntityType", ${input.entityId}::uuid, ${input.day}::date, 1)
                   ON CONFLICT ("entityType", "entityId", "day")
                   DO UPDATE SET "views" = "PageViewDaily"."views" + 1`,
      );
    },
  });
}
