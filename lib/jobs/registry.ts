import { db } from "@/lib/db";
import { runBlobCleanupOrphansJob } from "@/lib/jobs/blob-cleanup-orphans";

export type JobRunContext = {
  params?: unknown;
  actorEmail?: string | null;
};

export type JobResult = {
  message?: string;
  metadata?: Record<string, unknown>;
};

export type JobDefinition = {
  description: string;
  run: (ctx: JobRunContext) => Promise<JobResult | void>;
};

export const JOBS: Record<string, JobDefinition> = {
  "health.ping": {
    description: "Basic no-op health job used to verify job plumbing.",
    run: async () => ({
      message: "health ping ok",
      metadata: { ok: true },
    }),
  },
  "blob.cleanup-orphans": {
    description: "Delete unreferenced Vercel Blob images (dry-run supported).",
    run: async ({ params, actorEmail }) => runBlobCleanupOrphansJob({ params, actorEmail }),
  },
  "db.vacuum-lite": {
    description: "Lightweight DB check that validates connectivity and captures key table counts.",
    run: async () => {
      await db.$queryRaw`SELECT 1`;
      const [usersCount, eventsCount, venuesCount] = await Promise.all([
        db.user.count(),
        db.event.count(),
        db.venue.count(),
      ]);

      return {
        message: "database check completed",
        metadata: {
          usersCount,
          eventsCount,
          venuesCount,
        },
      };
    },
  },
};

export const JOB_NAMES = Object.keys(JOBS);
