const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  const adminEmail = process.env.ARTPULSE_ADMIN_EMAIL;
  const adminName = process.env.ARTPULSE_ADMIN_NAME || 'Admin';
  if (adminEmail) {
    await db.user.upsert({ where: { email: adminEmail }, update: { role: 'ADMIN', name: adminName }, create: { email: adminEmail, name: adminName, role: 'ADMIN' } });
  }
  const tags = [{ name: 'Photography', slug: 'photography' }, { name: 'Sculpture', slug: 'sculpture' }, { name: 'Free Entry', slug: 'free-entry' }];
  for (const t of tags) await db.tag.upsert({ where: { slug: t.slug }, update: { name: t.name }, create: t });
  const venue = await db.venue.upsert({ where: { slug: 'modern-gallery' }, update: { isPublished: true }, create: { name: 'Modern Gallery', slug: 'modern-gallery', city: 'London', isPublished: true } });
  const artist = await db.artist.upsert({ where: { slug: 'jane-doe' }, update: { isPublished: true }, create: { name: 'Jane Doe', slug: 'jane-doe', bio: 'Contemporary artist', isPublished: true } });
  const event = await db.event.upsert({ where: { slug: 'winter-exhibition' }, update: { isPublished: true, publishedAt: new Date() }, create: { title: 'Winter Exhibition', slug: 'winter-exhibition', startAt: new Date(), timezone: 'UTC', venueId: venue.id, isPublished: true, publishedAt: new Date() } });
  await db.eventArtist.upsert({ where: { eventId_artistId: { eventId: event.id, artistId: artist.id } }, update: {}, create: { eventId: event.id, artistId: artist.id } });
  const photoTag = await db.tag.findUnique({ where: { slug: 'photography' } });
  if (photoTag) await db.eventTag.upsert({ where: { eventId_tagId: { eventId: event.id, tagId: photoTag.id } }, update: {}, create: { eventId: event.id, tagId: photoTag.id } });
}
run().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});
