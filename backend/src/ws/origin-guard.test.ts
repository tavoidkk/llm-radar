import { describe, it, expect } from 'vitest';
import { verifyOrigin } from './origin-guard.js';
import type { IncomingMessage } from 'node:http';

function makeReq(origin: string | undefined, host = 'localhost:3000'): IncomingMessage {
  const headers: Record<string, string> = { host };
  if (origin) headers['origin'] = origin;
  return { headers } as unknown as IncomingMessage;
}

describe('origin-guard', () => {
  it('allows when no origin header (server-to-server, curl, Postman)', () => {
    const r = verifyOrigin(makeReq(undefined));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.reason).toBe('no-origin-header');
  });

  it('allows same-origin requests (host matches origin)', () => {
    const r = verifyOrigin(makeReq('http://localhost:3000', 'localhost:3000'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.reason).toBe('same-origin');
  });

  it('allows explicitly allow-listed origins (different host)', () => {
    const r = verifyOrigin(makeReq('http://localhost:3000', 'frontend.internal:3000'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.reason).toBe('allow-listed');
  });

  it('rejects origins not in allow-list and not same-origin', () => {
    const r = verifyOrigin(makeReq('http://evil.example.com'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('origin-not-allowed');
      expect(r.origin).toBe('http://evil.example.com');
    }
  });

  it('rejects malformed origin URLs', () => {
    const r = verifyOrigin(makeReq('not-a-url-at-all'));
    expect(r.ok).toBe(false);
  });
});