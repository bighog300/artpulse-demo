import { NextRequest, NextResponse } from "next/server";

type WindowState = { windowStart: number; count: number };

const memoryStore = new Map<string, WindowState>();

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }

  toBody() {
    return {
      error: "rate_limited",
      message: this.message,
      retryAfterSeconds: this.retryAfterSeconds,
    };
  }
}

function getWindowKey(key: string, windowMs: number, nowMs: number) {
  return `rl:${key}:${Math.floor(nowMs / windowMs)}`;
}

async function redisIncr(key: string, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const nowMs = Date.now();
  const windowKey = getWindowKey(key, windowMs, nowMs);
  const baseUrl = url.replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${token}` };

  const incrResp = await fetch(`${baseUrl}/incr/${encodeURIComponent(windowKey)}`, { headers, cache: "no-store" });
  if (!incrResp.ok) throw new Error("upstash_incr_failed");
  const incrData = (await incrResp.json()) as { result?: number };
  const count = Number(incrData.result ?? 0);

  if (count === 1) {
    await fetch(`${baseUrl}/pexpire/${encodeURIComponent(windowKey)}/${windowMs}`, { headers, cache: "no-store" });
  }

  const ttlResp = await fetch(`${baseUrl}/pttl/${encodeURIComponent(windowKey)}`, { headers, cache: "no-store" });
  const ttlData = ttlResp.ok ? ((await ttlResp.json()) as { result?: number }) : { result: windowMs };
  const ttlMs = Math.max(Number(ttlData.result ?? windowMs), 1);

  return { count, retryAfterSeconds: Math.max(Math.ceil(ttlMs / 1000), 1) };
}

function memoryIncr(key: string, windowMs: number) {
  const nowMs = Date.now();
  const current = memoryStore.get(key);

  if (!current || nowMs - current.windowStart >= windowMs) {
    memoryStore.set(key, { windowStart: nowMs, count: 1 });
    return { count: 1, retryAfterSeconds: Math.max(Math.ceil(windowMs / 1000), 1) };
  }

  current.count += 1;
  memoryStore.set(key, current);
  const retryAfterMs = Math.max(current.windowStart + windowMs - nowMs, 1);
  return { count: current.count, retryAfterSeconds: Math.max(Math.ceil(retryAfterMs / 1000), 1) };
}

async function consumeRateLimit(options: RateLimitOptions) {
  const redisResult = await redisIncr(options.key, options.windowMs).catch(() => null);
  if (redisResult) return redisResult;
  return memoryIncr(options.key, options.windowMs);
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const { count, retryAfterSeconds } = await consumeRateLimit(options);
  if (count <= options.limit) return;

  throw new RateLimitError(`Rate limit exceeded for ${options.key}`, retryAfterSeconds);
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function rateLimitErrorResponse(error: RateLimitError) {
  return NextResponse.json(error.toBody(), {
    status: 429,
    headers: { "Retry-After": String(error.retryAfterSeconds) },
  });
}

export function requestClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function principalRateLimitKey(req: NextRequest, scope: string, userId?: string | null) {
  if (userId) return `${scope}:user:${userId}`;
  return `${scope}:ip:${requestClientIp(req)}`;
}

export const RATE_LIMITS = {
  followsWrite: {
    limit: Number(process.env.RATE_LIMIT_FOLLOWS_WRITE_PER_MINUTE ?? 60),
    windowMs: Number(process.env.RATE_LIMIT_FOLLOWS_WRITE_WINDOW_MS ?? 60_000),
  },
  favoritesWrite: {
    limit: Number(process.env.RATE_LIMIT_FAVORITES_WRITE_PER_MINUTE ?? 60),
    windowMs: Number(process.env.RATE_LIMIT_FAVORITES_WRITE_WINDOW_MS ?? 60_000),
  },
  invitesCreate: {
    limit: Number(process.env.RATE_LIMIT_INVITES_CREATE_PER_HOUR ?? 10),
    windowMs: Number(process.env.RATE_LIMIT_INVITES_CREATE_WINDOW_MS ?? 3_600_000),
  },
  submissions: {
    limit: Number(process.env.RATE_LIMIT_SUBMISSIONS_PER_HOUR ?? 30),
    windowMs: Number(process.env.RATE_LIMIT_SUBMISSIONS_WINDOW_MS ?? 3_600_000),
  },
  uploads: {
    limit: Number(process.env.RATE_LIMIT_UPLOADS_PER_HOUR ?? 30),
    windowMs: Number(process.env.RATE_LIMIT_UPLOADS_WINDOW_MS ?? 3_600_000),
  },
  engagementWrite: {
    limit: Number(process.env.RATE_LIMIT_ENGAGEMENT_WRITE_PER_MINUTE ?? 120),
    windowMs: Number(process.env.RATE_LIMIT_ENGAGEMENT_WRITE_WINDOW_MS ?? 60_000),
  },
  venueImagesWrite: {
    limit: Number(process.env.RATE_LIMIT_VENUE_IMAGES_WRITE_PER_MINUTE ?? 60),
    windowMs: Number(process.env.RATE_LIMIT_VENUE_IMAGES_WRITE_WINDOW_MS ?? 60_000),
  },
  venueSubmitWrite: {
    limit: Number(process.env.RATE_LIMIT_VENUE_SUBMIT_WRITE_PER_HOUR ?? 20),
    windowMs: Number(process.env.RATE_LIMIT_VENUE_SUBMIT_WRITE_WINDOW_MS ?? 3_600_000),
  },
  eventSubmitWrite: {
    limit: Number(process.env.RATE_LIMIT_EVENT_SUBMIT_WRITE_PER_HOUR ?? 30),
    windowMs: Number(process.env.RATE_LIMIT_EVENT_SUBMIT_WRITE_WINDOW_MS ?? 3_600_000),
  },

} as const;
