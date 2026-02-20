import test from "node:test";
import assert from "node:assert/strict";
import { clearMeasurementData, getCurrentMetrics, getRecentExposures, getRecentOutcomes, recordExposureBatch, recordOutcome } from "../lib/personalization/measurement.ts";

const realNow = Date.now;

test.afterEach(() => {
  Date.now = realNow;
  clearMeasurementData();
});

test("Exposure dedupe avoids duplicate rerender records", () => {
  Date.now = () => 1_700_000_000_000;
  recordExposureBatch({ source: "for_you", items: [{ itemType: "event", itemKey: "event:a", position: 0, topReasonKind: "followed_venue" }] });
  recordExposureBatch({ source: "for_you", items: [{ itemType: "event", itemKey: "event:a", position: 0, topReasonKind: "followed_venue" }] });

  const exposures = getRecentExposures();
  assert.equal(exposures.length, 1);
});

test("Exposure cap records max N per page view", () => {
  Date.now = () => 1_700_000_000_000;
  recordExposureBatch({
    source: "for_you",
    items: Array.from({ length: 25 }, (_, index) => ({ itemType: "event" as const, itemKey: `event:${index}`, position: index, topReasonKind: "unknown" })),
  });

  const exposures = getRecentExposures();
  assert.equal(exposures.length, 20);
});

test("Outcome attribution inside 30 minutes attaches source and position", () => {
  Date.now = () => 1_700_000_000_000;
  recordExposureBatch({ source: "following", items: [{ itemType: "event", itemKey: "event:slug-1", position: 3, topReasonKind: "taste_tag" }] });

  Date.now = () => 1_700_000_000_000 + 10 * 60 * 1000;
  recordOutcome({ action: "click", itemType: "event", itemKey: "event:slug-1" });

  const [outcome] = getRecentOutcomes();
  assert.equal(outcome?.attributedExposure?.source, "following");
  assert.equal(outcome?.attributedExposure?.position, 3);
});

test("Attribution misses outside 30 minute window", () => {
  Date.now = () => 1_700_000_000_000;
  recordExposureBatch({ source: "for_you", items: [{ itemType: "event", itemKey: "event:slug-2", position: 1, topReasonKind: "nearby" }] });

  Date.now = () => 1_700_000_000_000 + 31 * 60 * 1000;
  recordOutcome({ action: "click", itemType: "event", itemKey: "event:slug-2" });

  const [outcome] = getRecentOutcomes();
  assert.equal(outcome?.attributedExposure, undefined);
});

test("Metrics aggregation increments CTR/save/follow and exploration CTR", () => {
  Date.now = () => 1_700_000_000_000;
  recordExposureBatch({
    source: "for_you",
    items: [
      { itemType: "event", itemKey: "event:x", position: 0, topReasonKind: "exploration", isExploration: true },
      { itemType: "event", itemKey: "event:y", position: 1, topReasonKind: "followed_venue", isExploration: false },
    ],
  });

  recordOutcome({ action: "click", itemType: "event", itemKey: "event:x", sourceHint: "for_you" });
  recordOutcome({ action: "save", itemType: "event", itemKey: "event:y", sourceHint: "for_you" });
  recordOutcome({ action: "follow", itemType: "event", itemKey: "event:y", sourceHint: "for_you" });

  const metrics = getCurrentMetrics();
  assert.equal(metrics.exposuresCount, 2);
  assert.equal(metrics.clicksCount, 1);
  assert.equal(metrics.savesCount, 1);
  assert.equal(metrics.followsCount, 1);
  assert.equal(metrics.ctr, 0.5);
  assert.equal(metrics.saveRate, 0.5);
  assert.equal(metrics.followRate, 0.5);
  assert.equal(metrics.explorationCtr, 1);
});
