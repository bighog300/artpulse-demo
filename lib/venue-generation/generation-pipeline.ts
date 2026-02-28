import { VenueClaimStatus, type Prisma } from "@prisma/client";
import { geocodeVenueAddressToLatLng } from "@/lib/geocode/mapbox-forward";
import { ensureUniqueVenueSlugWithDeps, slugifyVenueName } from "@/lib/venue-slug";
import { generatedVenuesResponseSchema, type GeneratedVenue, type VenueGenerationInput } from "@/lib/venue-generation/schemas";

type OpenAIResponse = {
  output_parsed?: unknown;
  output_text?: string;
};

type PipelineDb = {
  venue: {
    findMany: (args: { select: { name: true; city: true } }) => Promise<Array<{ name: string; city: string | null }>>;
    findUnique: (args: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
    create: (args: { data: Prisma.VenueCreateInput }) => Promise<{ id: string }>;
  };
  venueGenerationRun: {
    create: (args: { data: { country: string; region: string; totalReturned: number; totalCreated: number; totalSkipped: number; triggeredById: string } }) => Promise<{ id: string }>;
  };
};

type OpenAIClient = {
  createResponse: (args: { model: string; input: Array<{ role: "system" | "user"; content: string }>; schema: object }) => Promise<OpenAIResponse>;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function toJsonOpeningHours(value: string | null): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  return { raw: value };
}

function parseOpenAIJson(raw: OpenAIResponse): unknown {
  if (raw.output_parsed !== undefined) return raw.output_parsed;
  if (typeof raw.output_text === "string" && raw.output_text.trim()) {
    return JSON.parse(raw.output_text);
  }
  throw new Error("missing_model_output");
}

function venuePrompt(input: VenueGenerationInput) {
  return [
    "Return a comprehensive list of real visual-art venues for the specified geography.",
    "Include galleries, museums, art centres, artist-run spaces, sculpture parks, and foundations.",
    "Output ONLY JSON matching schema.",
    `Country: ${input.country}`,
    `Region: ${input.region}`,
  ].join("\n");
}

export async function runVenueGenerationPipeline(args: {
  input: VenueGenerationInput;
  triggeredById: string;
  db: PipelineDb;
  openai: OpenAIClient;
  geocode?: typeof geocodeVenueAddressToLatLng;
  model?: string;
}) {
  const existing = await args.db.venue.findMany({ select: { name: true, city: true } });
  const seen = new Set(existing.map((venue) => `${normalize(venue.name)}|${normalize(venue.city)}`));

  const response = await args.openai.createResponse({
    model: args.model?.trim() || process.env.VENUE_GENERATION_MODEL?.trim() || "gpt-4o-mini",
    input: [
      { role: "system", content: "You are a cultural directory researcher. Return strict JSON only." },
      { role: "user", content: venuePrompt(args.input) },
    ],
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["venues"],
      properties: {
        venues: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "addressLine1", "addressLine2", "city", "region", "postcode", "country", "contactEmail", "contactPhone", "websiteUrl", "instagramUrl", "openingHours", "venueType"],
            properties: {
              name: { type: "string" },
              addressLine1: { type: ["string", "null"] },
              addressLine2: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              region: { type: ["string", "null"] },
              postcode: { type: ["string", "null"] },
              country: { type: "string" },
              contactEmail: { type: ["string", "null"] },
              contactPhone: { type: ["string", "null"] },
              websiteUrl: { type: ["string", "null"] },
              instagramUrl: { type: ["string", "null"] },
              openingHours: { type: ["string", "null"] },
              venueType: { type: "string", enum: ["GALLERY", "MUSEUM", "ART_CENTRE", "FOUNDATION", "OTHER"] },
            },
          },
        },
      },
    },
  });

  const parsed = generatedVenuesResponseSchema.parse(parseOpenAIJson(response));
  const geocodeFn = args.geocode ?? geocodeVenueAddressToLatLng;

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const venue of parsed.venues) {
    const key = `${normalize(venue.name)}|${normalize(venue.city)}`;
    if (seen.has(key)) {
      totalSkipped += 1;
      continue;
    }

    const slugBase = slugifyVenueName(venue.name);
    const slug = await ensureUniqueVenueSlugWithDeps({ findBySlug: (candidate) => args.db.venue.findUnique({ where: { slug: candidate }, select: { id: true } }) }, slugBase);
    if (!slug) {
      totalSkipped += 1;
      continue;
    }

    const geocodeQuery = [venue.addressLine1, venue.city, venue.region, venue.country].filter(Boolean).join(", ");
    const geocoded = geocodeQuery ? await geocodeFn({ addressText: geocodeQuery }).catch(() => null) : null;

    const normalizedVenue: GeneratedVenue = {
      ...venue,
      name: venue.name.trim(),
      city: venue.city?.trim() || null,
      region: venue.region?.trim() || null,
      country: venue.country.trim(),
    };

    await args.db.venue.create({
      data: {
        name: normalizedVenue.name,
        slug,
        addressLine1: normalizedVenue.addressLine1,
        addressLine2: normalizedVenue.addressLine2,
        city: normalizedVenue.city,
        region: normalizedVenue.region,
        postcode: normalizedVenue.postcode,
        country: normalizedVenue.country,
        contactEmail: normalizedVenue.contactEmail,
        contactPhone: normalizedVenue.contactPhone,
        websiteUrl: normalizedVenue.websiteUrl,
        instagramUrl: normalizedVenue.instagramUrl,
        openingHours: toJsonOpeningHours(normalizedVenue.openingHours),
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        isPublished: false,
        aiGenerated: true,
        aiGeneratedAt: new Date(),
        claimStatus: VenueClaimStatus.UNCLAIMED,
      },
    });

    seen.add(key);
    totalCreated += 1;
  }

  const run = await args.db.venueGenerationRun.create({
    data: {
      country: args.input.country,
      region: args.input.region,
      totalReturned: parsed.venues.length,
      totalCreated,
      totalSkipped,
      triggeredById: args.triggeredById,
    },
  });

  return {
    runId: run.id,
    totalReturned: parsed.venues.length,
    totalCreated,
    totalSkipped,
  };
}

export async function createOpenAIResponsesClient(args: { apiKey: string }) {
  return {
    async createResponse(params: { model: string; input: Array<{ role: "system" | "user"; content: string }>; schema: object }) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${args.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: params.model,
          input: params.input,
          text: {
            format: {
              type: "json_schema",
              name: "venue_generation",
              strict: true,
              schema: params.schema,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`openai_error_${response.status}`);
      }

      return (await response.json()) as OpenAIResponse;
    },
  };
}
