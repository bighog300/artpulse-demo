import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type AdminAuditInput = {
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  req?: NextRequest | Request;
};

async function getRequestDetails(req?: NextRequest | Request) {
  const requestHeaders = req?.headers ?? (await headers());
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");
  return { ip: ip || null, userAgent: userAgent || null };
}

export async function logAdminAction(input: AdminAuditInput): Promise<void> {
  const { ip, userAgent } = await getRequestDetails(input.req);

  try {
    await db.adminAuditLog.create({
      data: {
        actorEmail: input.actorEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("admin_audit_log_failed", {
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      error,
    });
  }
}
