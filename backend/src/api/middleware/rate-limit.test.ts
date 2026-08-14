import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, rateLimitReset, getClientKey } from './rate-limit.js';
import type { IncomingMessage } from 'node:http';

function makeReq(xff?: string, remote = '203.0.113.99'): IncomingMessage {
  const headers: Record<string, string> = {};
  if (xff) headers['x-forwarded-for'] = xff;
  return {
    headers,
    socket: { remoteAddress: remote },
  } as unknown as IncomingMessage;
}

describe('rate-limit middleware', () => {
  beforeEach(() => {
    rateLimitReset();
  });

  it('allows first 45 requests within 60s window', () => {
    const req = makeReq('198.51.100.10');
    for (let i = 1; i <= 45; i++) {
      const r = rateLimit(req);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(45 - i);
    }
  });

  it('blocks 46th request with retry-after', () => {
    const req = makeReq('198.51.100.11');
    for (let i = 0; i < 45; i++) rateLimit(req);
    const blocked = rateLimit(req);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it('isolates buckets per IP', () => {
    const reqA = makeReq('198.51.100.20');
    const reqB = makeReq('198.51.100.21');
    for (let i = 0; i < 45; i++) rateLimit(reqA);
    const aBlocked = rateLimit(reqA);
    const bAllowed = rateLimit(reqB);
    expect(aBlocked.allowed).toBe(false);
    expect(bAllowed.allowed).toBe(true);
  });

  it('uses socket address when x-forwarded-for missing', () => {
    const req = makeReq(undefined, '198.51.100.30');
    const r = rateLimit(req);
    expect(r.allowed).toBe(true);
    expect(getClientKey(req)).toBe('198.51.100.30');
  });

  it('picks first IP from x-forwarded-for chain', () => {
    const req = makeReq('1.1.1.1, 2.2.2.2, 3.3.3.3');
    expect(getClientKey(req)).toBe('1.1.1.1');
  });

  it('falls back to "unknown" when no IP available', () => {
    const req = { headers: {}, socket: {} } as unknown as IncomingMessage;
    expect(getClientKey(req)).toBe('unknown');
  });
});