import test from "node:test";
import assert from "node:assert/strict";
import { computeEditorialNotificationCandidates, resolveEditorialNotificationRecipients } from "../lib/editorial-notification-logic.ts";

const now = new Date("2026-02-22T09:00:00.000Z");

test("notification computation finds goes-live and expires soon collections", async () => {
  const db = {
    curatedCollection: {
      findMany: async (args: any) => {
        if (args.where.publishStartsAt) {
          return [
            { id: "c-live", slug: "live", title: "Live Soon", publishStartsAt: new Date("2026-02-22T18:00:00.000Z"), publishEndsAt: null, showOnHome: true, showOnArtwork: false },
          ];
        }

        return [
          { id: "c-exp", slug: "exp", title: "Exp Soon", publishStartsAt: null, publishEndsAt: new Date("2026-02-23T06:00:00.000Z"), showOnHome: true, showOnArtwork: true },
        ];
      },
    },
    user: { findMany: async () => [] },
  };

  const notifications = await computeEditorialNotificationCandidates(now, db as never, {
    getQaSummary: async () => ({ totals: { collections: 0, publishedCollections: 0, items: 0 }, byCollection: [], duplicates: [] }),
  });

  assert.equal(notifications.length, 2);
  assert.equal(notifications[0]?.fingerprint, "LIVE_SOON:2026-02-22");
  assert.equal(notifications[1]?.fingerprint, "EXPIRES_SOON:2026-02-22");
});

test("qa issues fingerprint is deterministic and issue-filtered", async () => {
  const db = {
    curatedCollection: { findMany: async () => [] },
    user: { findMany: async () => [] },
  };

  const qaSummary = {
    totals: { collections: 1, publishedCollections: 1, items: 2 },
    duplicates: [],
    byCollection: [
      {
        id: "c1",
        title: "A",
        slug: "a",
        isPublished: true,
        state: "ACTIVE",
        pinned: true,
        homeRank: 1,
        counts: { totalItems: 2, unpublishedArtworks: 1, missingCover: 1, publishBlocked: 1, duplicatesInOtherCollections: 1 },
        flags: ["RANK_COLLISION"],
        adminEditHref: "",
        publicHref: "",
        suggestedActions: [],
      },
    ],
  };

  const first = await computeEditorialNotificationCandidates(now, db as never, { getQaSummary: async () => qaSummary as never });
  const second = await computeEditorialNotificationCandidates(now, db as never, { getQaSummary: async () => qaSummary as never });

  assert.equal(first.length, 1);
  assert.equal(first[0]?.kind, "COLLECTION_QA_ISSUES");
  assert.equal(first[0]?.fingerprint, second[0]?.fingerprint);
  assert.match(first[0]?.text ?? "", /rankCollision:1/);
  assert.match(first[0]?.text ?? "", /duplicates:1/);
});

test("recipient resolution respects EDITORIAL_NOTIFY_TO override and falls back to admins", async () => {
  process.env.EDITORIAL_NOTIFY_TO = " One@Example.com, two@example.com ";
  const fromOverride = await resolveEditorialNotificationRecipients({ user: { findMany: async () => [{ email: "admin@example.com" }] } } as never);
  assert.deepEqual(fromOverride, ["one@example.com", "two@example.com"]);

  delete process.env.EDITORIAL_NOTIFY_TO;
  const fromAdmins = await resolveEditorialNotificationRecipients({
    user: {
      findMany: async () => [{ email: "Admin@example.com" }, { email: "admin@example.com" }, { email: null }],
    },
  } as never);
  assert.deepEqual(fromAdmins, ["admin@example.com"]);
});
