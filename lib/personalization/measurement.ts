"use client";

import { track } from "@/lib/analytics/client";
import { getPersonalizationTuning, PERSONALIZATION_VERSION } from "@/lib/personalization/tuning";

const EXPOSURES_KEY = "ap_exposures_v3";
const OUTCOMES_KEY = "ap_outcomes_v3";
const METRICS_KEY = "ap_personalization_metrics_v3";
const SID_KEY = "ap_sid";

export type PersonalizationSource = "for_you" | "following" | "saved_search_preview" | "recommended_follows";
export type PersonalizationItemType = "event" | "artist" | "venue";
export type ScoreBucket = "top" | "mid" | "low";
export type OutcomeAction = "click" | "save" | "follow" | "hide" | "show_less";

export type Exposure = {
  sessionId: string;
  source: PersonalizationSource;
  version: string;
  ts: number;
  itemType: PersonalizationItemType;
  itemKey: string;
  position: number;
  scoreBucket: ScoreBucket;
  topReasonKind: string;
  isExploration: boolean;
  diversityAdjusted: boolean;
};

export type Outcome = {
  sessionId: string;
  ts: number;
  action: OutcomeAction;
  itemType: PersonalizationItemType;
  itemKey: string;
  attributedExposure?: Pick<Exposure, "source" | "position" | "topReasonKind" | "isExploration" | "version">;
};

type CandidateItem = {
  itemType: PersonalizationItemType;
  itemKey: string;
  position?: number;
  topReasonKind?: string;
  isExploration?: boolean;
  diversityAdjusted?: boolean;
};

type Metrics = {
  day: string;
  sessionId: string;
  version: string;
  exposuresCount: number;
  clicksCount: number;
  savesCount: number;
  followsCount: number;
  explorationExposuresCount: number;
  explorationClicksCount: number;
  lastEmittedAt?: number;
};

const memStore = new Map<string, string>();
const exposureViewCounter = new Map<string, number>();

const EXPOSURE_SAMPLE_RATE_PROD = 0.25;

function daySessionBucket(sessionId: string, dayKey: string) {
  const value = `${sessionId}:${dayKey}`;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

function shouldSampleExposure(sessionId: string, dayKey: string) {
  if (process.env.NODE_ENV !== "production") return true;
  return daySessionBucket(sessionId, dayKey) <= EXPOSURE_SAMPLE_RATE_PROD;
}


function storage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return {
    getItem: (key: string) => memStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memStore.set(key, value);
    },
    removeItem: (key: string) => {
      memStore.delete(key);
    },
  };
}

function sid() {
  const s = storage();
  const existing = s?.getItem(SID_KEY);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sid_${Date.now()}`;
  s?.setItem(SID_KEY, next);
  return next;
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function today(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function scoreBucket(position: number, total: number): ScoreBucket {
  const safeTotal = Math.max(1, total);
  const ratio = position / safeTotal;
  if (ratio < 0.33) return "top";
  if (ratio < 0.66) return "mid";
  return "low";
}

function metricsSnapshot(dayKey = today(Date.now())): Metrics {
  const s = storage();
  const existing = safeParseArray<Metrics>(s?.getItem(METRICS_KEY) ?? null).find((entry) => entry.day === dayKey);
  if (existing) return existing;
  return {
    day: dayKey,
    sessionId: sid(),
    version: PERSONALIZATION_VERSION,
    exposuresCount: 0,
    clicksCount: 0,
    savesCount: 0,
    followsCount: 0,
    explorationExposuresCount: 0,
    explorationClicksCount: 0,
  };
}

function saveMetrics(next: Metrics) {
  const s = storage();
  const entries = safeParseArray<Metrics>(s?.getItem(METRICS_KEY) ?? null).filter((entry) => entry.day !== next.day);
  entries.push(next);
  entries.sort((a, b) => a.day.localeCompare(b.day));
  const capped = entries.slice(-30);
  s?.setItem(METRICS_KEY, JSON.stringify(capped));
}


function sourceExposureBreakdown(dayKey: string) {
  const exposures = safeParseArray<Exposure>(storage()?.getItem(EXPOSURES_KEY) ?? null).filter((entry) => today(entry.ts) === dayKey);
  return exposures.reduce((acc, entry) => {
    acc[entry.source] = (acc[entry.source] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function emitSessionMetrics(force = false) {
  const current = metricsSnapshot();
  const now = Date.now();
  if (!force && current.lastEmittedAt && now - current.lastEmittedAt < 60_000) return;
  const ctr = current.exposuresCount ? current.clicksCount / current.exposuresCount : 0;
  const saveRate = current.exposuresCount ? current.savesCount / current.exposuresCount : 0;
  const followRate = current.exposuresCount ? current.followsCount / current.exposuresCount : 0;
  const explorationCtr = current.explorationExposuresCount ? current.explorationClicksCount / current.explorationExposuresCount : 0;

  const sourceBreakdown = sourceExposureBreakdown(current.day);

  track("personalization_session_metrics", {
    version: current.version,
    count: current.exposuresCount,
    clicksCount: current.clicksCount,
    savesCount: current.savesCount,
    followsCount: current.followsCount,
    ctr,
    saveRate,
    followRate,
    explorationCtr,
    source: Object.keys(sourceBreakdown).join(","),
  });

  saveMetrics({ ...current, lastEmittedAt: now });
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") emitSessionMetrics(true);
  });
}

export function recordExposureBatch({
  source,
  items,
}: {
  source: PersonalizationSource;
  items: CandidateItem[];
  debugMeta?: Record<string, unknown>;
}) {
  const s = storage();
  if (!s) return;
  const now = Date.now();
  const sessionId = sid();
  const { caps, limits } = getPersonalizationTuning();

  const path = typeof window !== "undefined" ? window.location.pathname : "unknown";
  const viewKey = `${sessionId}:${source}:${path}`;
  const consumed = exposureViewCounter.get(viewKey) ?? 0;
  const remaining = Math.max(0, limits.maxExposurePerView - consumed);
  if (remaining <= 0) return;

  const existing = safeParseArray<Exposure>(s.getItem(EXPOSURES_KEY));
  const dayKey = today(now);

  if (!shouldSampleExposure(sessionId, dayKey)) return;

  const next = items
    .slice(0, remaining)
    .map((item, idx) => {
      const position = item.position ?? consumed + idx;
      return {
        sessionId,
        source,
        version: PERSONALIZATION_VERSION,
        ts: now,
        itemType: item.itemType,
        itemKey: item.itemKey,
        position,
        scoreBucket: scoreBucket(position, Math.max(items.length, limits.maxExposurePerView)),
        topReasonKind: item.topReasonKind ?? "unknown",
        isExploration: Boolean(item.isExploration),
        diversityAdjusted: Boolean(item.diversityAdjusted),
      } satisfies Exposure;
    })
    .filter((candidate) => !existing.some((prev) => prev.sessionId === candidate.sessionId && prev.source === candidate.source && prev.itemKey === candidate.itemKey && today(prev.ts) === dayKey));

  if (!next.length) return;

  const merged = [...existing, ...next].sort((a, b) => a.ts - b.ts).slice(-caps);
  s.setItem(EXPOSURES_KEY, JSON.stringify(merged));
  exposureViewCounter.set(viewKey, consumed + next.length);

  const metric = metricsSnapshot();
  metric.exposuresCount += next.length;
  metric.explorationExposuresCount += next.filter((item) => item.isExploration).length;
  saveMetrics(metric);

  next.slice(0, limits.maxExposurePerView).forEach((item) => {
    track("personalization_exposure", {
      source: item.source,
      rankingVersion: process.env.NEXT_PUBLIC_PERSONALIZATION_VERSION === "v2" ? "v2" : "v3",
      version: item.version,
      position: item.position,
      scoreBucket: item.scoreBucket,
      topReasonKind: item.topReasonKind,
      isExploration: item.isExploration,
    });
  });

  if (metric.exposuresCount % limits.metricsExposureEmitStep === 0) emitSessionMetrics();
}

export function recordOutcome({ action, itemType, itemKey, sourceHint }: { action: OutcomeAction; itemType: PersonalizationItemType; itemKey: string; sourceHint?: PersonalizationSource }) {
  const s = storage();
  if (!s) return;
  const now = Date.now();
  const sessionId = sid();
  const { caps, limits } = getPersonalizationTuning();
  const exposures = safeParseArray<Exposure>(s.getItem(EXPOSURES_KEY));

  const attributedExposure = [...exposures]
    .sort((a, b) => b.ts - a.ts)
    .find((entry) => entry.itemKey === itemKey && (!sourceHint || entry.source === sourceHint) && now - entry.ts <= limits.attributionWindowMs);

  const outcome: Outcome = {
    sessionId,
    ts: now,
    action,
    itemType,
    itemKey,
    attributedExposure: attributedExposure
      ? {
        source: attributedExposure.source,
        position: attributedExposure.position,
        topReasonKind: attributedExposure.topReasonKind,
        isExploration: attributedExposure.isExploration,
        version: attributedExposure.version,
      }
      : undefined,
  };

  const outcomes = safeParseArray<Outcome>(s.getItem(OUTCOMES_KEY));
  outcomes.push(outcome);
  s.setItem(OUTCOMES_KEY, JSON.stringify(outcomes.slice(-caps)));

  const metric = metricsSnapshot();
  if (action === "click") metric.clicksCount += 1;
  if (action === "save") metric.savesCount += 1;
  if (action === "follow") metric.followsCount += 1;
  if (action === "click" && attributedExposure?.isExploration) metric.explorationClicksCount += 1;
  saveMetrics(metric);

  track("personalization_outcome", {
    source: attributedExposure?.source,
    rankingVersion: process.env.NEXT_PUBLIC_PERSONALIZATION_VERSION === "v2" ? "v2" : "v3",
    version: attributedExposure?.version ?? PERSONALIZATION_VERSION,
    action,
    targetType: itemType,
    position: attributedExposure?.position,
    topReasonKind: attributedExposure?.topReasonKind,
    isExploration: attributedExposure?.isExploration,
  });
}

export function getRecentExposures(limit = 50) {
  return safeParseArray<Exposure>(storage()?.getItem(EXPOSURES_KEY) ?? null).slice(-limit).reverse();
}

export function getRecentOutcomes(limit = 50) {
  return safeParseArray<Outcome>(storage()?.getItem(OUTCOMES_KEY) ?? null).slice(-limit).reverse();
}

export function getCurrentMetrics() {
  const metric = metricsSnapshot();
  const ctr = metric.exposuresCount ? metric.clicksCount / metric.exposuresCount : 0;
  const saveRate = metric.exposuresCount ? metric.savesCount / metric.exposuresCount : 0;
  const followRate = metric.exposuresCount ? metric.followsCount / metric.exposuresCount : 0;
  const explorationCtr = metric.explorationExposuresCount ? metric.explorationClicksCount / metric.explorationExposuresCount : 0;
  return { ...metric, ctr, saveRate, followRate, explorationCtr };
}

export function clearMeasurementData() {
  const s = storage();
  s?.removeItem(EXPOSURES_KEY);
  s?.removeItem(OUTCOMES_KEY);
  s?.removeItem(METRICS_KEY);
  exposureViewCounter.clear();
}

export const MEASUREMENT_KEYS = { EXPOSURES_KEY, OUTCOMES_KEY, METRICS_KEY };
