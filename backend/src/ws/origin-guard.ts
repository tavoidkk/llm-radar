import type { IncomingMessage } from 'http';
import { allowedOrigins } from '../config/env.js';

export type OriginDecision =
  | { ok: true; reason: 'same-origin' | 'allow-listed' | 'no-origin-header' }
  | { ok: false; reason: 'origin-not-allowed'; origin: string };

export function verifyOrigin(req: IncomingMessage): OriginDecision {
  const originHeader = req.headers.origin;
  const host = req.headers.host;

  if (!originHeader) {
    return { ok: true, reason: 'no-origin-header' };
  }

  try {
    const originUrl = new URL(originHeader);
    if (host && originUrl.host === host) {
      return { ok: true, reason: 'same-origin' };
    }
  } catch {
    return { ok: false, reason: 'origin-not-allowed', origin: originHeader };
  }

  if (allowedOrigins().includes(originHeader)) {
    return { ok: true, reason: 'allow-listed' };
  }

  return { ok: false, reason: 'origin-not-allowed', origin: originHeader };
}