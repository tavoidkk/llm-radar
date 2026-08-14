import type { IncomingMessage, ServerResponse } from 'http';
import { applyCors } from './middleware/cors.js';
import { rateLimit } from './middleware/rate-limit.js';
import { sendError, sendJson } from './util/response.js';
import { handleHistory } from './handlers/history.js';
import { handleTrends } from './handlers/trends.js';
import { handleTopModels, handleModels } from './handlers/top-models.js';
import { observeHttpLatency } from '../observability/metrics.js';
import { aaHealth } from '../services/aa-health.js';

export interface Route {
  method: string;
  pattern: RegExp;
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
  rateLimited?: boolean;
  pathLabel: string;
}

export const routes: Route[] = [
  { method: 'GET', pattern: /^\/api\/ai-models\/history(?:\?|$)/, handler: handleHistory, rateLimited: true,  pathLabel: '/api/ai-models/history' },
  { method: 'GET', pattern: /^\/api\/ai-models\/trends(?:\?|$)/,   handler: handleTrends,   rateLimited: true,  pathLabel: '/api/ai-models/trends' },
  { method: 'GET', pattern: /^\/api\/ai-models\/top(?:\?|$)/,       handler: handleTopModels, rateLimited: true,  pathLabel: '/api/ai-models/top' },
  { method: 'GET', pattern: /^\/api\/models(?:\?|$)/,              handler: handleModels,                          pathLabel: '/api/models' },
  { method: 'GET', pattern: /^\/healthz(?:\?|$)/,                  handler: (_req, res) => { sendJson(res, 200, { status: aaHealth.ok ? 'ok' : 'degraded', uptime: process.uptime(), aa: { ...aaHealth } }); }, pathLabel: '/healthz' },
  { method: 'GET', pattern: /^\/metrics(?:\?|$)/,                  handler: (_req, res) => { res.setHeader('Content-Type', 'text/plain; version=0.0.4'); res.end(renderPromText()); }, pathLabel: '/metrics' },
];

import { renderMetrics } from '../observability/metrics.js';
function renderPromText(): string {
  return renderMetrics();
}

export async function handleHttp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startedAt = process.hrtime.bigint();
  const url = req.url ?? '/';
  const pathOnly = url.split('?', 1)[0] ?? '/';

  let matched: Route | undefined;

  let finished = false;
  const finish = (): void => {
    if (finished) return;
    finished = true;
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    if (matched) {
      observeHttpLatency(matched.method, matched.pathLabel, res.statusCode, elapsedMs);
    }
    if (matched && elapsedMs > 150) {
      console.warn(`[latency] ${matched.method} ${matched.pathLabel} ${res.statusCode} ${elapsedMs.toFixed(1)}ms (>150ms RNF-4.1)`);
    }
  };

  res.on('close', finish);
  res.on('finish', finish);

  if (!applyCors(req, res)) return;

  for (const route of routes) {
    if (route.method === req.method && route.pattern.test(pathOnly)) {
      matched = route;
      if (route.rateLimited) {
        const rl = rateLimit(req, 45);
        res.setHeader('X-RateLimit-Limit', '45');
        res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
        res.setHeader('X-RateLimit-Reset', String(rl.resetMs));
        if (!rl.allowed) {
          res.setHeader('Retry-After', String(Math.ceil(rl.retryAfterMs / 1000)));
          sendError(res, 429, 'rate_limited', 'Too many requests, max 45/min per IP.');
          return;
        }
      }
      try {
        await route.handler(req, res);
      } catch (err) {
        console.error(`[api] ${route.method} ${pathOnly} crashed:`, (err as Error).message);
        if (!res.headersSent) sendError(res, 500, 'internal_error', 'Unexpected server error');
      }
      return;
    }
  }

  sendError(res, 404, 'not_found', `No route for ${req.method} ${pathOnly}`);
}