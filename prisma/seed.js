const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  const summary = { created: 0, updated: 0, linked: 0 };

  async function trackedUpsert(model, args) {
    const existing = await model.findUnique({ where: args.where, select: { id: true } });
    const result = await model.upsert(args);
    summary[existing ? "updated" : "created"] += 1;
    return result;
  }

  const adminEmail = process.env.ARTPULSE_ADMIN_EMAIL;
  const adminName = process.env.ARTPULSE_ADMIN_NAME || "Admin";
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
  ];
  for (const t of tags) {
    await trackedUpsert(db.tag, { where: { slug: t.slug }, update: { name: t.name }, create: t });
  }

  const venue = await trackedUpsert(db.venue, {
    where: { slug: "modern-gallery" },
    update: { name: "Modern Gallery", city: "London", isPublished: true },
    create: { name: "Modern Gallery", slug: "modern-gallery", city: "London", isPublished: true },
  });

  const artist = await trackedUpsert(db.artist, {
    where: { slug: "jane-doe" },
    update: { name: "Jane Doe", bio: "Contemporary artist", isPublished: true },
    create: { name: "Jane Doe", slug: "jane-doe", bio: "Contemporary artist", isPublished: true },
  });

  const event = await trackedUpsert(db.event, {
    where: { slug: "winter-exhibition" },
    update: { title: "Winter Exhibition", timezone: "UTC", venueId: venue.id, isPublished: true, publishedAt: { set: new Date("2025-01-01T00:00:00Z") } },
    create: {
      title: "Winter Exhibition",
      slug: "winter-exhibition",
      startAt: new Date("2025-01-15T18:00:00Z"),
      timezone: "UTC",
      venueId: venue.id,
      isPublished: true,
      publishedAt: new Date("2025-01-01T00:00:00Z"),
    },
  });

  await db.eventArtist.upsert({
    where: { eventId_artistId: { eventId: event.id, artistId: artist.id } },
    update: {},
    create: { eventId: event.id, artistId: artist.id },
  });
  summary.linked += 1;

  for (const tag of tags) {
    const t = await db.tag.findUnique({ where: { slug: tag.slug } });
    if (!t) continue;
    await db.eventTag.upsert({
      where: { eventId_tagId: { eventId: event.id, tagId: t.id } },
      update: {},
      create: { eventId: event.id, tagId: t.id },
    });
    summary.linked += 1;
  }

  console.log(`Seed summary: created=${summary.created} updated=${summary.updated} linked=${summary.linked}`);
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
