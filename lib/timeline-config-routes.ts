import { NextRequest, NextResponse } from "next/server";
import { getRequestId } from "@/lib/request-id";
import {
  AdminSettings,
  AdminSettingsSchema,
  SelectionSet,
  SelectionSetSchema,
  TimelineIndex,
  TimelineIndexSchema,
} from "@/lib/timeline-schemas";
import { apiSchemaError, zodIssues } from "@/lib/timeline-api-error";

let selectionSetStore: SelectionSet = { ids: [], updatedAt: new Date(0).toISOString() };
let timelineIndexStore: TimelineIndex = { version: 1, entries: [] };
let adminSettingsStore: AdminSettings = { allowSummaries: true, maxArtifacts: 100 };

export async function handleSelectionSetGet(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const parsed = SelectionSetSchema.safeParse(selectionSetStore);
  if (!parsed.success) return apiSchemaError(500, "invalid_data", "Stored selection set is invalid", zodIssues(parsed.error), requestId);
  return NextResponse.json(parsed.data);
}

export async function handleSelectionSetPut(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const body = await req.json().catch(() => null);
  const parsed = SelectionSetSchema.safeParse(body);
  if (!parsed.success) return apiSchemaError(400, "invalid_request", "Invalid selection set", zodIssues(parsed.error), requestId);
  selectionSetStore = parsed.data;
  return NextResponse.json(parsed.data);
}

export async function handleTimelineIndexGet(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const parsed = TimelineIndexSchema.safeParse(timelineIndexStore);
  if (!parsed.success) return apiSchemaError(500, "invalid_data", "Stored timeline index is invalid", zodIssues(parsed.error), requestId);
  return NextResponse.json(parsed.data);
}

export async function handleTimelineIndexPut(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const body = await req.json().catch(() => null);
  const parsed = TimelineIndexSchema.safeParse(body);
  if (!parsed.success) return apiSchemaError(400, "invalid_request", "Invalid timeline index", zodIssues(parsed.error), requestId);
  timelineIndexStore = parsed.data;
  return NextResponse.json(parsed.data);
}

export async function handleAdminSettingsGet(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const parsed = AdminSettingsSchema.safeParse(adminSettingsStore);
  if (!parsed.success) return apiSchemaError(500, "invalid_data", "Stored admin settings are invalid", zodIssues(parsed.error), requestId);
  return NextResponse.json(parsed.data);
}

export async function handleAdminSettingsPut(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const body = await req.json().catch(() => null);
  const parsed = AdminSettingsSchema.safeParse(body);
  if (!parsed.success) return apiSchemaError(400, "invalid_request", "Invalid admin settings", zodIssues(parsed.error), requestId);
  adminSettingsStore = parsed.data;
  return NextResponse.json(parsed.data);
}
