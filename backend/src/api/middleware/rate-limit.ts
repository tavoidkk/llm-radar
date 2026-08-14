import type { IncomingMessage } from 'http';

interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;
const WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs: number;
}

export function getClientKey(req: IncomingMessage): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export function rateLimit(req: IncomingMessage, limit = 45): RateLimitResult {
  const key = getClientKey(req);
  const now = Date.now();

  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }

  const cutoff = now - WINDOW_MS;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: WINDOW_MS,
      retryAfterMs: Math.max(0, oldest + WINDOW_MS - now),
    };
  }

  bucket.timestamps.push(now);

  if (store.size > MAX_KEYS) {
    const overflow = store.size - MAX_KEYS;
    const it = store.keys();
    for (let i = 0; i < overflow; i++) {
      const k = it.next().value;
      if (k === undefined) break;
      store.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    resetMs: WINDOW_MS,
    retryAfterMs: 0,
  };
}

export function rateLimitReset(): void {
  store.clear();
}