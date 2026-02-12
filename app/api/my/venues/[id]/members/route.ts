import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { canManageVenueMembers } from "@/lib/ownership";
import { parseBody, venueIdParamSchema, venueMemberCreateSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

async function requireVenueMemberManager(venueId: string) {
  const user = await requireAuth();
  if (user.role === "ADMIN") return user;

  const membership = await db.venueMembership.findUnique({
    where: { userId_venueId: { userId: user.id, venueId } },
    select: { role: true },
  });

  if (!membership || !canManageVenueMembers(membership.role, false)) {
    throw new Error("forbidden");
  }

  return user;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = venueIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    await requireVenueMemberManager(parsedId.data.id);

    const members = await db.venueMembership.findMany({
      where: { venueId: parsedId.data.id },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return NextResponse.json(members.map((member) => ({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      user: member.user,
    })));
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Owner membership required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = venueIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    await requireVenueMemberManager(parsedId.data.id);

    const parsedBody = venueMemberCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const targetUser = await db.user.findUnique({
      where: { email: parsedBody.data.email },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return apiError(400, "invalid_request", "User not found for that email");
    }

    const member = await db.venueMembership.upsert({
      where: { userId_venueId: { userId: targetUser.id, venueId: parsedId.data.id } },
      create: {
        userId: targetUser.id,
        venueId: parsedId.data.id,
        role: parsedBody.data.role,
      },
      update: {
        role: parsedBody.data.role,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return NextResponse.json({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      user: member.user,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Owner membership required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
