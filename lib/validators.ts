import { z } from "zod";
import { normalizeAssociationRole } from "@/lib/association-roles";

export const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be lowercase and hyphenated");
export const httpUrlSchema = z.url().refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
  message: "Must be an http(s) URL",
});

export const httpsUrlSchema = z.url().refine((value) => value.startsWith("https://"), {
  message: "Must be an https URL",
});

const isoDatetimeSchema = z.iso.datetime({ offset: true }).or(z.iso.datetime({ local: true }));
const isoDateSchema = z.iso.date();

const fromQueryDateSchema = isoDatetimeSchema.or(isoDateSchema.transform((value) => `${value}T00:00:00Z`));
const toQueryDateSchema = isoDatetimeSchema.or(isoDateSchema.transform((value) => `${value}T23:59:59.999Z`));

export const eventsQuerySchema = z.object({
  query: z.string().trim().min(1).max(120).optional(),
  from: fromQueryDateSchema.optional(),
  to: toQueryDateSchema.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  venue: slugSchema.optional(),
  artist: slugSchema.optional(),
  tags: z.string().optional().refine((value) => !value || value.split(",").map((tag) => tag.trim()).filter(Boolean).length <= 20, "tags must include at most 20 values"),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const searchQuerySchema = z.object({ query: z.string().trim().min(1).optional() });
export const slugParamSchema = z.object({ slug: slugSchema });
export const idParamSchema = z.object({ id: z.string().uuid() });
export const venueIdParamSchema = z.object({ id: z.string().uuid() });
export const artistIdParamSchema = z.object({ id: z.string().uuid() });
export const eventIdParamSchema = z.object({ eventId: z.string().uuid() });
export const venueEventSubmitParamSchema = z.object({ venueId: z.string().uuid(), eventId: z.string().uuid() });
export const memberIdParamSchema = z.object({ memberId: z.string().uuid() });
export const inviteIdParamSchema = z.object({ inviteId: z.string().uuid() });
export const tokenParamSchema = z.object({ token: z.string().trim().min(16).max(255) });

export const imageIdParamSchema = z.object({ imageId: z.string().uuid() });
export const associationIdParamSchema = z.object({ associationId: z.string().uuid() });
export const associationModerationParamsSchema = z.object({ id: z.string().uuid(), associationId: z.string().uuid() });

export const artistVenueAssociationRoleSchema = z.unknown().transform((value) => normalizeAssociationRole(value));

export const artistVenueRequestBodySchema = z.object({
  venueId: z.string().uuid(),
  role: artistVenueAssociationRoleSchema.optional(),
  message: z.string().trim().max(500).optional(),
});

export const venueUploadUrlRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
});

export const artistUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
});

export const artistImageCreateSchema = z.object({
  url: httpUrlSchema,
  alt: z.string().trim().max(300).optional().nullable(),
  assetId: z.string().uuid().optional().nullable(),
});

export const artistImageUpdateSchema = z.object({
  alt: z.string().trim().max(300).optional().nullable(),
});

export const artistImageReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).refine((value) => new Set(value).size === value.length, "orderedIds must be unique"),
});

export const artistCoverPatchSchema = z.object({
  imageId: z.string().uuid(),
});

export const myArtistPatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  bio: z.string().trim().max(4000).optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
});

export const venueImageCreateSchema = z.object({
  url: httpUrlSchema,
  key: z.string().trim().min(1).max(400).optional(),
  alt: z.string().trim().max(300).optional().nullable(),
});

export const venueImageUpdateSchema = z.object({
  alt: z.string().trim().max(300).optional().nullable(),
});

export const venueImageReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).refine((value) => new Set(value).size === value.length, "orderedIds must be unique"),
});

export const venueCoverPatchSchema = z.object({
  imageId: z.string().uuid().optional(),
  venueImageId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  const candidateId = data.imageId ?? data.venueImageId;
  if (!candidateId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["imageId"], message: "imageId is required" });
  }
});


export const adminEntityImageCreateSchema = z.object({
  url: httpUrlSchema,
  alt: z.string().trim().max(300).optional().nullable(),
  makePrimary: z.boolean().optional(),
  setPrimary: z.boolean().optional(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  width: z.number().int().min(1).max(10_000).optional(),
  height: z.number().int().min(1).max(10_000).optional(),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024).optional(),
  size: z.number().int().positive().max(20 * 1024 * 1024).optional(),
}).refine((data) => !(data.makePrimary !== undefined && data.setPrimary !== undefined), {
  message: "Provide only one of makePrimary or setPrimary",
});

export const adminEntityImagePatchSchema = z.object({
  url: httpsUrlSchema.optional(),
  alt: z.string().trim().max(300).optional().nullable(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  width: z.number().int().min(1).max(10_000).optional(),
  height: z.number().int().min(1).max(10_000).optional(),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024).optional(),
  size: z.number().int().positive().max(20 * 1024 * 1024).optional(),
  isPrimary: z.literal(true).optional(),
}).refine((data) => data.alt !== undefined || data.isPrimary === true || data.url !== undefined || data.contentType !== undefined || data.width !== undefined || data.height !== undefined || data.sizeBytes !== undefined || data.size !== undefined, {
  message: "At least one field must be provided",
});

export const adminEntityImageReorderSchema = z.object({
  order: z.array(z.string().uuid()).min(1).refine((value) => new Set(value).size === value.length, "order must be unique"),
});

export const favoriteBodySchema = z.object({
  targetType: z.enum(["EVENT", "VENUE", "ARTIST"]),
  targetId: z.string().uuid(),
});

export const followBodySchema = z.object({
  targetType: z.enum(["ARTIST", "VENUE"]),
  targetId: z.string().uuid(),
});

export const followManageBulkDeleteSchema = z.object({
  targets: z.array(followBodySchema).min(1).max(100),
});

export const savedSearchToggleSchema = z.object({
  isEnabled: z.boolean(),
});

export const savedSearchFrequencySchema = z.object({
  frequency: z.enum(["WEEKLY", "OFF"]),
});

export const savedSearchRenameSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export const notificationsReadBatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const followingFeedQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  cursor: z.string().max(512).optional(),
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



export const engagementMetaSchema = z.object({
  digestRunId: z.string().uuid().optional(),
  position: z.number().int().min(0).max(500).optional(),
  query: z.string().trim().min(1).max(120).optional(),
  feedback: z.enum(["up", "down"]).optional(),
}).strict();

export const engagementBodySchema = z.object({
  surface: z.enum(["DIGEST", "NEARBY", "SEARCH", "FOLLOWING"]),
  action: z.enum(["VIEW", "CLICK", "FOLLOW", "SAVE_SEARCH"]),
  targetType: z.enum(["EVENT", "VENUE", "ARTIST", "SAVED_SEARCH", "DIGEST_RUN"]),
  targetId: z.string().trim().min(1).max(120),
  meta: engagementMetaSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.meta?.feedback && data.action !== "CLICK") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meta", "feedback"],
      message: "feedback is only valid when action is CLICK",
    });
  }
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

export const analyticsWindowQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
});

export const adminAnalyticsDrilldownQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  targetType: z.enum(["EVENT", "VENUE", "ARTIST"]),
  targetId: z.string().trim().min(1).max(80),
  metric: z.enum(["clicks", "views"]).default("clicks"),
});

export const adminAnalyticsTopTargetsQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  targetType: z.enum(["EVENT", "VENUE", "ARTIST"]),
  metric: z.enum(["clicks", "views"]).default("clicks"),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export const forYouRecommendationsQuerySchema = z.object({
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  limit: z.coerce.number().int().min(5).max(30).default(20),
});

export const engagementRetentionQuerySchema = z.object({
  dryRun: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  keepDays: z.coerce.number().int().min(30).max(365).default(90),
});

export const nearbyEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().int().min(1).max(200),
  days: z.enum(["7", "30"]).default("7").transform((value) => Number(value) as 7 | 30),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminArtistCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
  bio: z.string().optional().nullable(),
  websiteUrl: httpUrlSchema.optional().nullable(),
  instagramUrl: httpUrlSchema.optional().nullable(),
  avatarImageUrl: httpUrlSchema.optional().nullable(),
  featuredImageUrl: httpUrlSchema.optional().nullable(),
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
  featuredImageUrl: httpUrlSchema.optional().nullable(),
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



export const eventRevisionPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(20).optional().nullable(),
  startAt: isoDatetimeSchema.optional(),
  endAt: isoDatetimeSchema.optional().nullable(),
  ticketUrl: httpUrlSchema.optional().nullable(),
  images: z.array(eventImageSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.startAt && data.endAt && new Date(data.endAt) <= new Date(data.startAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "endAt must be > startAt" });
  }
});

export const eventRevisionBodySchema = z.object({
  patch: eventRevisionPatchSchema,
  message: z.string().trim().max(2000).optional(),
});

export const venueSubmitBodySchema = z.object({
  message: z.string().trim().max(2000).optional(),
});

export const eventSubmitBodySchema = z.object({
  message: z.string().trim().max(2000).optional(),
});

export const artistSubmitBodySchema = z.object({
  message: z.string().trim().max(2000).optional(),
});

export const adminSubmissionRequestChangesSchema = z.object({
  message: z.string().trim().min(10).max(2000),
});


export const betaAccessRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  note: z.string().trim().max(1000).optional(),
});

export const betaFeedbackSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  pagePath: z.string().trim().max(500).optional(),
  message: z.string().trim().min(1).max(2000),
});

export const betaRequestStatusPatchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
});

export const submissionDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  decisionReason: z.string().trim().max(2000).optional().nullable(),
});

export const venueMemberCreateSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(["OWNER", "EDITOR"]),
});

export const venueMemberPatchSchema = z.object({
  role: z.enum(["OWNER", "EDITOR"]),
});

export const venueInviteCreateSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
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
