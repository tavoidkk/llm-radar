process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(40);
process.env.OPENROUTER_API_KEY = 'sk-or-v1-fake-test-key-1234567890';
process.env.PORT = '18081';
process.env.WS_ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.POLL_INTERVAL_MS = '60000';
process.env.BATCH_INTERVAL_MS = '60000';

import { WebSocket } from 'ws';
import { setTimeout as delay } from 'node:timers/promises';

const { startHttpServer, closeHttpServer } = await import('../src/server.js');
const { cache } = await import('../src/services/cache.js');
import type { MetricPayload } from '@llm-radar/types';

const fakeMetric: MetricPayload = {
  modelId: 'openai/gpt-4o',
  eloRating: 1320,
  tokensPerSec: 80,
  costInput: 0.005,
  costOutput: 0.015,
  source: 'openrouter',
  timestamp: new Date().toISOString(),
};
cache.set([fakeMetric]);

const { wss, http: _http } = { wss: undefined as never, http: undefined as never };
void wss;
void _http;

const { http, wss: wsServer } = startHttpServer();
await delay(300);

console.log('[ws-smoke] connecting from allowed origin...');
const wsAllowed = new WebSocket(`ws://127.0.0.1:${process.env.PORT}`, { headers: { origin: 'http://localhost:3000' } });
let snapshotReceived = false;

await new Promise<void>((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout waiting for snapshot')), 3000);
  wsAllowed.on('open', () => console.log('[ws-smoke] allowed-origin socket opened'));
  wsAllowed.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log('[ws-smoke] message:', JSON.stringify(msg).slice(0, 120));
    if (msg.type === 'snapshot') {
      snapshotReceived = true;
      clearTimeout(t);
      wsAllowed.close();
      resolve();
    }
  });
  wsAllowed.on('error', (err) => {
    clearTimeout(t);
    reject(err);
  });
});

if (!snapshotReceived) {
  console.error('[ws-smoke] FAIL: no snapshot received');
  await closeHttpServer(http, wsServer);
  process.exit(1);
}
console.log('[ws-smoke] OK: snapshot received from allowed origin');

console.log('[ws-smoke] connecting from disallowed origin...');
const wsBlocked = new WebSocket(`ws://127.0.0.1:${process.env.PORT}`, { headers: { origin: 'http://evil.example.com' } });
let blockedClosed = false;

await new Promise<void>((resolve) => {
  const t = setTimeout(() => resolve(), 2000);
  wsBlocked.on('close', (code, reason) => {
    blockedClosed = true;
    console.log(`[ws-smoke] blocked-origin closed code=${code} reason=${reason.toString()}`);
    clearTimeout(t);
    resolve();
  });
  wsBlocked.on('open', () => {
    console.log('[ws-smoke] WARN: blocked-origin opened (will be closed shortly)');
  });
  wsBlocked.on('error', () => {
    if (!blockedClosed) {
      clearTimeout(t);
      resolve();
    }
  });
});

if (!blockedClosed) {
  console.error('[ws-smoke] FAIL: blocked origin not rejected');
  await closeHttpServer(http, wsServer);
  process.exit(1);
}
console.log('[ws-smoke] OK: blocked origin rejected');

await closeHttpServer(http, wsServer);
console.log('[ws-smoke] all checks passed');
process.exit(0);