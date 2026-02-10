import { z } from "zod";

export const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be lowercase and hyphenated");
export const httpUrlSchema = z.url().refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
  message: "Must be an http(s) URL",
});

const isoDatetimeSchema = z.iso.datetime({ offset: true }).or(z.iso.datetime({ local: true }));

export const eventsQuerySchema = z.object({
  query: z.string().trim().min(1).optional(),
  from: isoDatetimeSchema.optional(),
  to: isoDatetimeSchema.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  venue: slugSchema.optional(),
  artist: slugSchema.optional(),
  tags: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchQuerySchema = z.object({ query: z.string().trim().min(1).optional() });
export const slugParamSchema = z.object({ slug: slugSchema });
export const idParamSchema = z.object({ id: z.string().uuid() });

export const favoriteBodySchema = z.object({
  targetType: z.enum(["EVENT", "VENUE", "ARTIST"]),
  targetId: z.string().uuid(),
});

export const adminArtistCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
  bio: z.string().optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const adminArtistPatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  bio: z.string().optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const adminVenueCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  contactEmail: z.email().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const adminVenuePatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  description: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  contactEmail: z.email().optional().nullable(),
  isPublished: z.boolean().optional(),
});

const eventImageSchema = z.object({
  url: httpUrlSchema,
  alt: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

const adminEventShape = {
  title: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().optional().nullable(),
  timezone: z.string().trim().min(1),
  startAt: isoDatetimeSchema,
  endAt: isoDatetimeSchema.optional().nullable(),
  venueId: z.string().uuid().optional().nullable(),
  tagSlugs: z.array(slugSchema).optional(),
  artistSlugs: z.array(slugSchema).optional(),
  images: z.array(eventImageSchema).optional(),
  isPublished: z.boolean().optional(),
};

export const adminEventCreateSchema = z.object(adminEventShape).superRefine((data, ctx) => {
  if (data.endAt && new Date(data.endAt) < new Date(data.startAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be >= startAt" });
  }
});

export const adminEventPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  description: z.string().optional().nullable(),
  timezone: z.string().trim().min(1).optional(),
  startAt: isoDatetimeSchema.optional(),
  endAt: isoDatetimeSchema.optional().nullable(),
  venueId: z.string().uuid().optional().nullable(),
  tagSlugs: z.array(slugSchema).optional(),
  artistSlugs: z.array(slugSchema).optional(),
  images: z.array(eventImageSchema).optional(),
  isPublished: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.startAt && data.endAt && new Date(data.endAt) < new Date(data.startAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be >= startAt" });
  }
});

export function zodDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}

function formValueToPrimitive(value: FormDataEntryValue) {
  if (typeof value !== "string") return value;
  const normalized = value.trim();
  if (normalized === "") return null;
  if (normalized === "true" || normalized === "on") return true;
  if (normalized === "false") return false;
  if (!Number.isNaN(Number(normalized)) && normalized !== "") return Number(normalized);
  return normalized;
}

export async function parseBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await req.json();
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    return Object.fromEntries(Array.from((await req.formData()).entries()).map(([k, v]) => [k, formValueToPrimitive(v)]));
  }
  return {};
}

export function paramsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}
