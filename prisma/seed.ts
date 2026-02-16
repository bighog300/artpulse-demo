import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function seedAllowed() {
  if (process.env.SEED_ENABLED === "true") return true;
  const env = (process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || "").toLowerCase();
  return env === "staging" || env === "preview" || env === "ci" || env === "test";
}

async function run() {
  if (!seedAllowed()) {
    console.log("Seed skipped: set SEED_ENABLED=true for local runs (or use staging/preview/ci env).");
    return;
  }

  const summary = { created: 0, updated: 0, linked: 0 };

  async function trackedUpsert(model: any, args: any) {
    const existing = await model.findUnique({ where: args.where, select: { id: true } });
    const result = await model.upsert(args);
    summary[existing ? "updated" : "created"] += 1;
    return result;
  }

  const adminEmail = process.env.ARTPULSE_ADMIN_EMAIL;
  const adminName = process.env.ARTPULSE_ADMIN_NAME || "Preview Admin";

  if (adminEmail) {
    await trackedUpsert(db.user, {
      where: { email: adminEmail.toLowerCase() },
      update: { role: "ADMIN", name: adminName },
      create: { email: adminEmail.toLowerCase(), name: adminName, role: "ADMIN" },
    });
  }

  const tags = [
    { name: "Photography", slug: "photography" },
    { name: "Sculpture", slug: "sculpture" },
    { name: "Free Entry", slug: "free-entry" },
    { name: "Performance", slug: "performance" },
  ];

  const venues = [
    { slug: "modern-gallery", name: "Modern Gallery", city: "London" },
    { slug: "riverfront-arts", name: "Riverfront Arts", city: "Manchester" },
  ];

  const artists = [
    { slug: "jane-doe", name: "Jane Doe", bio: "Contemporary artist" },
    { slug: "liam-ng", name: "Liam Ng", bio: "Sculptor exploring recycled materials" },
    { slug: "amina-khan", name: "Amina Khan", bio: "Photographer focused on night scenes" },
  ];

  const tagBySlug = new Map<string, { id: string }>();
  for (const tag of tags) {
    const result = await trackedUpsert(db.tag, { where: { slug: tag.slug }, update: { name: tag.name }, create: tag });
    tagBySlug.set(tag.slug, { id: result.id });
  }

  const venueBySlug = new Map<string, { id: string }>();
  for (const venue of venues) {
    const result = await trackedUpsert(db.venue, {
      where: { slug: venue.slug },
      update: { name: venue.name, city: venue.city, isPublished: true },
      create: { ...venue, isPublished: true },
    });
    venueBySlug.set(venue.slug, { id: result.id });
  }

  const artistBySlug = new Map<string, { id: string }>();
  for (const artist of artists) {
    const result = await trackedUpsert(db.artist, {
      where: { slug: artist.slug },
      update: { name: artist.name, bio: artist.bio, isPublished: true },
      create: { ...artist, isPublished: true },
    });
    artistBySlug.set(artist.slug, { id: result.id });
  }

  const events = Array.from({ length: 10 }, (_, i) => {
    const day = i + 1;
    return {
      slug: `preview-event-${day}`,
      title: `Preview Event ${day}`,
      startAt: new Date(`2026-03-${String(day).padStart(2, "0")}T18:00:00.000Z`),
      venueSlug: i % 2 === 0 ? "modern-gallery" : "riverfront-arts",
      artistSlug: artists[i % artists.length].slug,
      tagSlugs: i % 2 === 0 ? ["photography", "free-entry"] : ["sculpture", "performance"],
    };
  });

  for (const event of events) {
    const venueId = venueBySlug.get(event.venueSlug)?.id;
    if (!venueId) continue;

    const eventRecord = await trackedUpsert(db.event, {
      where: { slug: event.slug },
      update: {
        title: event.title,
        timezone: "UTC",
        startAt: event.startAt,
        venueId,
        isPublished: true,
        publishedAt: { set: new Date("2026-02-01T00:00:00.000Z") },
      },
      create: {
        slug: event.slug,
        title: event.title,
        timezone: "UTC",
        startAt: event.startAt,
        venueId,
        isPublished: true,
        publishedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    });

    const artistId = artistBySlug.get(event.artistSlug)?.id;
    if (artistId) {
      await db.eventArtist.upsert({
        where: { eventId_artistId: { eventId: eventRecord.id, artistId } },
        update: {},
        create: { eventId: eventRecord.id, artistId },
      });
      summary.linked += 1;
    }

    for (const tagSlug of event.tagSlugs) {
      const tagId = tagBySlug.get(tagSlug)?.id;
      if (!tagId) continue;
      await db.eventTag.upsert({
        where: { eventId_tagId: { eventId: eventRecord.id, tagId } },
        update: {},
        create: { eventId: eventRecord.id, tagId },
      });
      summary.linked += 1;
    }
  }

  console.log(`Seed summary: created=${summary.created} updated=${summary.updated} linked=${summary.linked}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
