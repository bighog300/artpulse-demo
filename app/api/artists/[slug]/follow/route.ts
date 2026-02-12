import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { slugParamSchema, zodDetails } from "@/lib/validators";
import { followStatusResponse } from "@/lib/follow-counts";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugParamSchema.safeParse(await params);
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsed.error));

  const artist = await db.artist.findFirst({ where: { slug: parsed.data.slug, isPublished: true }, select: { id: true } });
  if (!artist) return apiError(404, "not_found", "Artist not found");

  const user = await getSessionUser();
  const [followersCount, follow] = await Promise.all([
    db.follow.count({ where: { targetType: "ARTIST", targetId: artist.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "ARTIST", targetId: artist.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  return NextResponse.json(followStatusResponse({ followersCount, isAuthenticated: Boolean(user), hasFollow: Boolean(follow) }));
}
