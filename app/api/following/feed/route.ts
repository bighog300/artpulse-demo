import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getFollowingFeedWithDeps } from "@/lib/following-feed";
import { followingFeedQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const parsed = followingFeedQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

  try {
    const user = await requireAuth();
    const result = await getFollowingFeedWithDeps(
      {
        now: () => new Date(),
        findFollows: async (userId) => db.follow.findMany({ where: { userId }, select: { targetType: true, targetId: true } }),
        findEvents: async ({ artistIds, venueIds, from, to, cursor, limit }) => db.event.findMany({
          where: {
            isPublished: true,
            startAt: { gte: from, lte: to },
            OR: [
              ...(venueIds.length ? [{ venueId: { in: venueIds } }] : []),
              ...(artistIds.length ? [{ eventArtists: { some: { artistId: { in: artistIds } } } }] : []),
            ],
          },
          take: limit,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          orderBy: [{ startAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            startAt: true,
            endAt: true,
            venue: { select: { name: true, slug: true } },
          },
        }),
      },
      {
        userId: user.id,
        days: parsed.data.days,
        type: parsed.data.type,
        cursor: parsed.data.cursor,
        limit: parsed.data.limit,
      },
    );

    return NextResponse.json(result);
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
