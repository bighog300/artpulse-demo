import { z } from "zod";

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});

export const DriveSummaryJsonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  updatedAt: z.string().min(1).optional(),
});

export const SummarizeRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  summaryFileIds: z.array(z.string().min(1)).max(100).default([]),
});

export const SummarizeResponseSchema = z.object({
  summary: z.string().min(1),
  artifactCount: z.number().int().min(0),
});

export const SelectionSetSchema = z.object({
  ids: z.array(z.string().min(1)).max(500),
  updatedAt: z.string().min(1),
});

export const TimelineIndexSchema = z.object({
  version: z.number().int().min(1),
  entries: z.array(z.object({ id: z.string().min(1), ts: z.string().min(1) })),
});

export const AdminSettingsSchema = z.object({
  allowSummaries: z.boolean(),
  maxArtifacts: z.number().int().min(1).max(500),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type DriveSummaryJson = z.infer<typeof DriveSummaryJsonSchema>;
export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;
export type SummarizeResponse = z.infer<typeof SummarizeResponseSchema>;
export type SelectionSet = z.infer<typeof SelectionSetSchema>;
export type TimelineIndex = z.infer<typeof TimelineIndexSchema>;
export type AdminSettings = z.infer<typeof AdminSettingsSchema>;
