import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { runJob, RunJobError } from "@/lib/jobs/run-job";
import { parseBody, zodDetails } from "@/lib/validators";
import { z } from "zod";

const runJobBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  params: z.unknown().optional(),
});

type AdminJobsRunDeps = {
  requireAdminUser: () => Promise<{ email: string }>;
  runJobFn: typeof runJob;
  logAdminAction: (input: {
    actorEmail: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
    req: NextRequest;
  }) => Promise<void>;
};

export async function handleAdminJobRun(req: NextRequest, deps: AdminJobsRunDeps) {
  try {
    const admin = await deps.requireAdminUser();

    const parsed = runJobBodySchema.safeParse(await parseBody(req));
    if (!parsed.success) {
      return apiError(400, "invalid_request", "Invalid request body", zodDetails(parsed.error));
    }

    const run = await deps.runJobFn(parsed.data.name, {
      trigger: "admin",
      actorEmail: admin.email,
      params: parsed.data.params as Prisma.InputJsonValue | undefined,
    });

    await deps.logAdminAction({
      actorEmail: admin.email,
      action: "admin.job.run",
      targetType: "job",
      targetId: parsed.data.name,
      metadata: {
        params: parsed.data.params ?? null,
        status: run.status,
        jobRunId: run.id,
      } satisfies Prisma.InputJsonValue,
      req,
    });

    return NextResponse.json({ ok: true, run });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Admin role required");
    }
    if (error instanceof RunJobError && error.status === 409) {
      return apiError(409, "job_already_running", "A run for this job is already in progress");
    }
    if (error instanceof RunJobError && error.status === 400) {
      return apiError(400, "invalid_job_name", "Unable to run job");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
