# UI & UX — Artpulse

## Public screens
- Home: upcoming near you + quick filters
- Search: keyword + filters (persist in URL)
- Events list: chronological
- Event detail: hero, key facts, map, CTA, gallery, tags, related
- Venue detail: profile + gallery + grouped upcoming/past events + strong event CTAs
- Artist detail: profile + events
- Calendar: month/week/list + filters

## Admin
- Dashboard + CRUD tables
- Editor forms with draft/publish toggle

## Accessibility
- keyboard navigable
- visible focus states
- alt text for images

## Venue cover behavior
- Venue managers can set a gallery image as the venue cover from `/my/venues/[id]` using **Set as cover**.
- The selected cover is visibly marked in the gallery manager.
- Venue index cards (`/venues`) use this cover image as the card hero image.
- Venue detail metadata (Open Graph image) prefers this cover image for sharing previews.
