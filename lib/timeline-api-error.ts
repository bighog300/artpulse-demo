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
  return error.issues.map((issue) => {
    const basePath = issue.path.join(".");
    const keyPath = issue.code === "unrecognized_keys" && "keys" in issue && issue.keys.length > 0
      ? issue.keys.join(",")
      : "";

    return {
      path: [basePath, keyPath].filter(Boolean).join("."),
      message: issue.message,
      code: issue.code,
    };
  });
}
