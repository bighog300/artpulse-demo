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
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchQuerySchema = z.object({ query: z.string().trim().min(1).optional() });
export const slugParamSchema = z.object({ slug: slugSchema });
export const idParamSchema = z.object({ id: z.string().uuid() });
export const venueIdParamSchema = z.object({ id: z.string().uuid() });
export const eventIdParamSchema = z.object({ eventId: z.string().uuid() });
export const memberIdParamSchema = z.object({ memberId: z.string().uuid() });
export const inviteIdParamSchema = z.object({ inviteId: z.string().uuid() });
export const tokenParamSchema = z.object({ token: z.string().trim().min(16).max(255) });

export const favoriteBodySchema = z.object({
  targetType: z.enum(["EVENT", "VENUE", "ARTIST"]),
  targetId: z.string().uuid(),
});

export const followBodySchema = z.object({
  targetType: z.enum(["ARTIST", "VENUE"]),
  targetId: z.string().uuid(),
});

export const followingFeedQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(["both", "artist", "venue"]).default("both"),
});

export const locationPreferenceSchema = z.object({
  locationLabel: z.string().trim().min(1).max(120).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  radiusKm: z.number().int().min(1).max(200).default(25),
}).superRefine((data, ctx) => {
  const hasLat = data.lat != null;
  const hasLng = data.lng != null;
  if (hasLat !== hasLng) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [hasLat ? "lng" : "lat"], message: "lat and lng must be provided together" });
  }
});

export const nearbyEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().int().min(1).max(200),
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminArtistCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
  bio: z.string().optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
  featuredAssetId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const adminArtistPatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  bio: z.string().optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
  featuredAssetId: z.string().uuid().optional().nullable(),
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
  featuredImageUrl: httpUrlSchema.optional().nullable(),
  featuredAssetId: z.string().uuid().optional().nullable(),
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
  featuredImageUrl: httpUrlSchema.optional().nullable(),
  featuredAssetId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const myVenuePatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
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
  featuredImageUrl: httpUrlSchema.optional().nullable(),
  featuredAssetId: z.string().uuid().optional().nullable(),
  submitForApproval: z.boolean().optional(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const myVenueCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema.optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: httpUrlSchema.optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

const eventImageSchema = z.object({
  assetId: z.string().uuid().optional().nullable(),
  url: httpUrlSchema.optional().nullable(),
  alt: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
}).superRefine((data, ctx) => {
  if (!data.assetId && !data.url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["url"], message: "Either assetId or url is required" });
  }
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

const myEventShape = {
  title: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().optional().nullable(),
  timezone: z.string().trim().min(1),
  startAt: isoDatetimeSchema,
  endAt: isoDatetimeSchema.optional().nullable(),
  images: z.array(eventImageSchema).optional(),
  note: z.string().trim().max(2000).optional().nullable(),
};

export const myEventCreateSchema = z.object(myEventShape).superRefine((data, ctx) => {
  if (data.endAt && new Date(data.endAt) < new Date(data.startAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be >= startAt" });
  }
});

export const myEventPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  description: z.string().optional().nullable(),
  timezone: z.string().trim().min(1).optional(),
  startAt: isoDatetimeSchema.optional(),
  endAt: isoDatetimeSchema.optional().nullable(),
  images: z.array(eventImageSchema).optional(),
  note: z.string().trim().max(2000).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.startAt && data.endAt && new Date(data.endAt) < new Date(data.startAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be >= startAt" });
  }
});

export const submissionDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  decisionReason: z.string().trim().max(2000).optional().nullable(),
});

export const venueMemberCreateSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(["OWNER", "EDITOR"]),
});

export const venueMemberPatchSchema = z.object({
  role: z.enum(["OWNER", "EDITOR"]),
});

export const venueInviteCreateSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(["OWNER", "EDITOR"]),
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
