import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { handleEngagementPost } from "@/lib/engagement-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleEngagementPost(req, {
    getSessionUser,
    createEvent: async (input) => {
      await db.engagementEvent.create({ data: input });
    },
  });
}
