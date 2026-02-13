import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { handleEngagementPost } from "@/lib/engagement-route";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleEngagementPost(req, {
    getSessionUser,
    createEvent: async (input) => {
      const { metaJson, ...rest } = input;
      const data: Prisma.EngagementEventCreateInput = {
        ...rest,
        ...(metaJson === undefined ? {} : { metaJson: metaJson === null ? Prisma.JsonNull : metaJson }),
      };
      await db.engagementEvent.create({ data });
    },
  });
}
