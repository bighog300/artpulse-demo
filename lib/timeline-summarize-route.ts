import { NextRequest, NextResponse } from "next/server";
import { getRequestId } from "@/lib/request-id";
import {
  DriveSummaryJson,
  DriveSummaryJsonSchema,
  SummarizeRequestSchema,
  SummarizeResponseSchema,
} from "@/lib/timeline-schemas";
import { apiSchemaError, zodIssues } from "@/lib/timeline-api-error";

type Deps = {
  readSummaryJson: (fileId: string) => Promise<string>;
  summarize: (prompt: string, artifacts: DriveSummaryJson[]) => Promise<{ summary: string }>;
};

const defaultDeps: Deps = {
  readSummaryJson: async () => "{}",
  summarize: async (_prompt, artifacts) => ({ summary: `Processed ${artifacts.length} artifacts` }),
};

export async function handleTimelineSummarizePost(req: NextRequest, deps: Deps = defaultDeps) {
  const requestId = getRequestId(req.headers);
  const body = await req.json().catch(() => null);
  const parsedRequest = SummarizeRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return apiSchemaError(400, "invalid_request", "Invalid summarize payload", zodIssues(parsedRequest.error), requestId);
  }

  const artifacts: DriveSummaryJson[] = [];
  for (const fileId of parsedRequest.data.summaryFileIds) {
    const raw = await deps.readSummaryJson(fileId);
    let parsed = DriveSummaryJsonSchema.safeParse(null);
    try {
      parsed = DriveSummaryJsonSchema.safeParse(JSON.parse(raw));
    } catch {
      parsed = DriveSummaryJsonSchema.safeParse(null);
    }
    if (!parsed.success) {
      console.warn("Skipping invalid Summary.json artifact", { requestId, fileId, issues: zodIssues(parsed.error) });
      continue;
    }
    artifacts.push(parsed.data);
  }

  const responseCandidate = {
    ...(await deps.summarize(parsedRequest.data.prompt, artifacts)),
    artifactCount: artifacts.length,
  };

  const parsedResponse = SummarizeResponseSchema.safeParse(responseCandidate);
  if (!parsedResponse.success) {
    return apiSchemaError(500, "invalid_response", "Summarize response failed schema validation", zodIssues(parsedResponse.error), requestId);
  }

  return NextResponse.json(parsedResponse.data);
}
