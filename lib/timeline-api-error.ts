import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiErrorSchema } from "@/lib/timeline-schemas";

export function apiSchemaError(status: number, code: string, message: string, details?: unknown, requestId?: string) {
  const payload = ApiErrorSchema.parse({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
      ...(requestId ? { requestId } : {}),
    },
  });

  return NextResponse.json(payload, { status });
}

export function zodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}
