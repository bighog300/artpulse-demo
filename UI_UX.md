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

## Venue self-serve publishing flow

- `/my/venues/[id]` now includes a dedicated **Publishing** panel with status mapping:
  - `DRAFT` (or no submission): Draft
  - `SUBMITTED`: Pending review
  - `REJECTED`: Needs changes
  - `APPROVED`/`isPublished=true`: Published
- Owners can submit using **Submit for review** when required fields pass server validation.
- Validation issues are surfaced inline before submission and from API responses:
  - Missing name
  - Description below minimum length
  - Missing cover image
  - Missing address basics (address line or city + country)
  - Invalid website URL (if provided)
- While pending review, the form remains editable and users are informed that a review is in progress.
- Once published, the panel links directly to the live `/venues/[slug]` page.

## Event self-serve publishing flow

- `/my/venues/[id]/submit-event` shows per-event publishing status:
  - Draft
  - Pending review
  - Needs changes
  - Published
- Venue members can submit each draft event for review from the same page.
- Event validation issues from the API are shown inline on the relevant event row.
- Reviewer feedback is shown for events in `Needs changes`.
- Authentication failures redirect users to `/login?next=...` and successful actions show toasts.
- Public event pages and venue event sections continue to display published events only.

## Published event revision workflow

- Published events remain live while venue members submit **revisions** for review.
- On `/my/venues/[id]/submit-event`:
  - Draft events continue using submit-to-publish flow.
  - Published events use **Propose edits** and create `REVISION` submissions.
  - Revision statuses are shown as `Live`, `Revision pending`, `Needs changes` (with reviewer feedback), and `Applied`.
- Admin approval of a revision applies the proposed changes atomically to the published event (without unpublishing it).
- Admin request-changes leaves the published event untouched and returns reviewer feedback to the member UI.
