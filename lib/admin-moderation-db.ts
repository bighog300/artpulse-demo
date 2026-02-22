import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { EntityType, ModerationDeps, QueueItem } from "@/lib/admin-moderation-route";

const publishKinds = [{ kind: "PUBLISH" as const }, { kind: null }];

function queueSort(items: QueueItem[]) {
  return items.sort((a, b) => new Date(b.submittedAtISO).getTime() - new Date(a.submittedAtISO).getTime());
}

export function createAdminModerationDeps(): ModerationDeps {
  return {
    requireAdminUser: requireAdmin,
    getQueueItems: async () => {
      const [artistSubmissions, venueSubmissions, eventSubmissions] = await Promise.all([
        db.submission.findMany({
          where: { type: "ARTIST", status: "SUBMITTED", OR: publishKinds },
          include: { targetArtist: true, submitter: { select: { id: true, email: true, name: true } } },
        }),
        db.submission.findMany({
          where: { type: "VENUE", status: "SUBMITTED", OR: publishKinds },
          include: { targetVenue: true, submitter: { select: { id: true, email: true, name: true } } },
        }),
        db.submission.findMany({
          where: { type: "EVENT", status: "SUBMITTED", OR: publishKinds },
          include: { targetEvent: true, submitter: { select: { id: true, email: true, name: true } } },
        }),
      ]);

      const items: QueueItem[] = [
        ...artistSubmissions.filter((s) => s.submittedAt && s.targetArtistId && s.targetArtist).map((s) => ({
          entityType: "ARTIST" as const,
          submissionId: s.id,
          entityId: s.targetArtistId as string,
          title: s.targetArtist?.name ?? "Untitled artist",
          slug: s.targetArtist?.slug ?? null,
          submittedAtISO: s.submittedAt!.toISOString(),
          creator: s.submitter,
          summary: s.targetArtist?.bio ? "Bio added" : "Bio missing",
        })),
        ...venueSubmissions.filter((s) => s.submittedAt && s.targetVenueId && s.targetVenue).map((s) => ({
          entityType: "VENUE" as const,
          submissionId: s.id,
          entityId: s.targetVenueId as string,
          title: s.targetVenue?.name ?? "Untitled venue",
          slug: s.targetVenue?.slug ?? null,
          submittedAtISO: s.submittedAt!.toISOString(),
          creator: s.submitter,
          summary: [s.targetVenue?.city, s.targetVenue?.country].filter(Boolean).join(", ") || null,
        })),
        ...eventSubmissions.filter((s) => s.submittedAt && s.targetEventId && s.targetEvent).map((s) => ({
          entityType: "EVENT" as const,
          submissionId: s.id,
          entityId: s.targetEventId as string,
          title: s.targetEvent?.title ?? "Untitled event",
          slug: s.targetEvent?.slug ?? null,
          submittedAtISO: s.submittedAt!.toISOString(),
          creator: s.submitter,
          summary: s.targetEvent?.startAt?.toISOString() ?? null,
        })),
      ];
      return queueSort(items);
    },
    findSubmission: async (entityType: EntityType, submissionId: string) => db.submission.findFirst({
      where: { id: submissionId, type: entityType },
      select: { id: true, status: true, targetArtistId: true, targetVenueId: true, targetEventId: true },
    }),
    approveSubmission: async (entityType: EntityType, submissionId: string, admin) => {
      await db.$transaction(async (tx) => {
        const submission = await tx.submission.update({
          where: { id: submissionId },
          data: { status: "APPROVED", decidedAt: new Date(), decidedByUserId: admin.id, rejectionReason: null, decisionReason: null },
          select: { id: true, targetArtistId: true, targetVenueId: true, targetEventId: true },
        });

        if (entityType === "ARTIST" && submission.targetArtistId) await tx.artist.update({ where: { id: submission.targetArtistId }, data: { isPublished: true } });
        if (entityType === "VENUE" && submission.targetVenueId) await tx.venue.update({ where: { id: submission.targetVenueId }, data: { isPublished: true } });
        if (entityType === "EVENT" && submission.targetEventId) await tx.event.update({ where: { id: submission.targetEventId }, data: { isPublished: true, publishedAt: new Date() } });

        await tx.adminAuditLog.create({
          data: {
            actorEmail: admin.email ?? admin.id,
            action: "ADMIN_SUBMISSION_APPROVED",
            targetType: entityType,
            targetId: submission.id,
            metadata: {
              actorUserId: admin.id,
              entityType,
              entityId: submission.targetArtistId ?? submission.targetVenueId ?? submission.targetEventId,
              submissionId: submission.id,
            },
          },
        });
      });
    },
    rejectSubmission: async (entityType: EntityType, submissionId: string, admin, rejectionReason: string) => {
      await db.$transaction(async (tx) => {
        const submission = await tx.submission.update({
          where: { id: submissionId },
          data: { status: "REJECTED", decidedAt: new Date(), decidedByUserId: admin.id, rejectionReason, decisionReason: rejectionReason },
          select: { id: true, targetArtistId: true, targetVenueId: true, targetEventId: true },
        });

        await tx.adminAuditLog.create({
          data: {
            actorEmail: admin.email ?? admin.id,
            action: "ADMIN_SUBMISSION_REJECTED",
            targetType: entityType,
            targetId: submission.id,
            metadata: {
              actorUserId: admin.id,
              entityType,
              entityId: submission.targetArtistId ?? submission.targetVenueId ?? submission.targetEventId,
              submissionId: submission.id,
            },
          },
        });
      });
    },
  };
}
