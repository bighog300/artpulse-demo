import test from "node:test";
import assert from "node:assert/strict";
import { decodeNearbyCursor, encodeNearbyCursor } from "../../lib/nearby-cursor";
import { START_AT_ID_ORDER_BY } from "../../lib/cursor-predicate";
import { decodeSubmissionsCursor, encodeSubmissionsCursor } from "../../lib/admin-submissions-cursor";
import { decideSubmission, ModerationDecisionError } from "../../lib/moderation-decision-service";

function makeModerationDbState() {
  return {
    submission: {
      id: "sub-1",
      type: "VENUE" as const,
      status: "SUBMITTED" as const,
      submitterUserId: "user-1",
      targetArtistId: null,
      targetVenueId: "venue-1",
      targetEventId: null,
      submitter: { id: "user-1", email: "submitter@example.com" },
      targetVenue: { slug: "venue-one" },
      targetEvent: null,
      decidedAt: null,
      decidedByUserId: null,
      decisionReason: null,
      rejectionReason: null,
    },
    venuePublished: false,
    audits: [] as Array<{ action: string }>,
    notifications: [] as Array<{ userId: string }> ,
  };
}

function makeDbHarness(state: ReturnType<typeof makeModerationDbState>, opts?: { failNotification?: boolean }) {
  return {
    $transaction: async (fn: (tx: any) => Promise<unknown>) => {
      const snapshot = structuredClone(state);
      const tx = {
        submission: {
          findUnique: async () => state.submission,
          update: async ({ data }: { data: Record<string, unknown> }) => {
            state.submission = { ...state.submission, ...data } as typeof state.submission;
            return state.submission;
          },
        },
        venue: {
          update: async () => { state.venuePublished = true; },
        },
        artist: { update: async () => undefined },
        event: { update: async () => undefined },
        adminAuditLog: {
          create: async ({ data }: { data: { action: string } }) => { state.audits.push({ action: data.action }); },
        },
        notification: {
          create: async ({ data }: { data: { userId: string } }) => {
            if (opts?.failNotification) throw new Error("notification down");
            state.notifications.push({ userId: data.userId });
          },
        },
      };
      try {
        return await fn(tx);
      } catch (error) {
        Object.assign(state, snapshot);
        throw error;
      }
    },
  };
}

test("nearby cursor roundtrips via base64url encoding", () => {
  const payload = { id: "evt_123", startAt: new Date("2026-03-01T12:00:00.000Z") };

  const encoded = encodeNearbyCursor(payload);
  const decoded = decodeNearbyCursor(encoded);

  assert.deepEqual(decoded, payload);
});

test("nearby cursor decode returns null for invalid payload", () => {
  assert.equal(decodeNearbyCursor("not-a-valid-cursor"), null);
});

test("startAt/id ordering keeps id as deterministic tie-breaker", () => {
  assert.deepEqual(START_AT_ID_ORDER_BY, [{ startAt: "asc" }, { id: "asc" }]);
});

test("moderation approval is atomic: no partial writes on failure", async () => {
  const state = makeModerationDbState();
  const dbHarness = makeDbHarness(state, { failNotification: true });

  await assert.rejects(
    decideSubmission({ submissionId: state.submission.id, actor: { id: "editor-1", role: "EDITOR" }, decision: "APPROVE" }, dbHarness as never),
    /notification down/,
  );

  assert.equal(state.submission.status, "SUBMITTED");
  assert.equal(state.venuePublished, false);
  assert.deepEqual(state.audits, []);
  assert.deepEqual(state.notifications, []);
});

test("moderators cannot approve their own submissions", async () => {
  const state = makeModerationDbState();
  const dbHarness = makeDbHarness(state);

  await assert.rejects(
    decideSubmission({ submissionId: state.submission.id, actor: { id: "user-1", role: "EDITOR" }, decision: "APPROVE" }, dbHarness as never),
    (error: unknown) => error instanceof ModerationDecisionError && error.status === 403,
  );

  assert.equal(state.submission.status, "SUBMITTED");
  assert.equal(state.venuePublished, false);
  assert.deepEqual(state.audits, []);
  assert.deepEqual(state.notifications, []);
});

test("admin submissions pagination: no duplicates/skips across cursor pages under mixed submittedAt", () => {
  const seeded = [
    { id: "s9", submittedAt: new Date("2026-01-03T00:00:00.000Z") },
    { id: "s8", submittedAt: new Date("2026-01-03T00:00:00.000Z") },
    { id: "s7", submittedAt: new Date("2026-01-02T00:00:00.000Z") },
    { id: "s6", submittedAt: new Date("2026-01-02T00:00:00.000Z") },
    { id: "s5", submittedAt: new Date("2026-01-01T00:00:00.000Z") },
  ];

  const ordered = [...seeded].sort((a, b) => {
    const t = b.submittedAt.getTime() - a.submittedAt.getTime();
    return t !== 0 ? t : b.id.localeCompare(a.id);
  });

  const pageSize = 2;
  const page1 = ordered.slice(0, pageSize);
  const cursor1 = encodeSubmissionsCursor({ id: page1[page1.length - 1]!.id, submittedAtISO: page1[page1.length - 1]!.submittedAt.toISOString() });
  const decoded1 = decodeSubmissionsCursor(cursor1);
  assert.ok(decoded1);

  const page2 = ordered
    .filter((item) => item.submittedAt.getTime() < new Date(decoded1!.submittedAtISO).getTime()
      || (item.submittedAt.getTime() === new Date(decoded1!.submittedAtISO).getTime() && item.id < decoded1!.id))
    .slice(0, pageSize);

  const combined = [...page1, ...page2].map((item) => item.id);
  assert.equal(new Set(combined).size, combined.length);
  assert.deepEqual(combined, ordered.slice(0, combined.length).map((item) => item.id));
});

test.todo("notification read-batch sets readAt consistently", {
  // Current read-batch route updates only `status: \"READ\"` and does not set readAt.
  // Phase 2 note: will be fixed by centralizing read semantics in lib/notification-inbox.ts.
});
