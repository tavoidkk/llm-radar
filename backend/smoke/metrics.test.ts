process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(40);
process.env.OPENROUTER_API_KEY = 'sk-or-v1-fake-test-key-1234567890';
process.env.PORT = '18082';
process.env.WS_ALLOWED_ORIGINS = 'http://localhost:3000';

import type { ServerResponse, IncomingMessage } from 'http';

const { handleHttp } = await import('../src/api/router.js');
const { renderMetrics } = await import('../src/observability/metrics.js');

function makeRes(): { res: ServerResponse; read: () => Promise<{ status: number; body: string; headers: Record<string, string> }> } {
  const headers: Record<string, string> = {};
  let resolveFn: (v: { status: number; body: string; headers: Record<string, string> }) => void = () => {};
  const done = new Promise<{ status: number; body: string; headers: Record<string, string> }>((res) => { resolveFn = res; });
  const finishListeners: Array<() => void> = [];
const closeListeners: Array<() => void> = [];

const fakeRes = {
  statusCode: 200,
  setHeader(k: string, v: string) { headers[k] = v; },
  getHeader(k: string) { return headers[k]; },
  on(evt: string, fn: (...a: unknown[]) => void) {
    if (evt === 'finish') finishListeners.push(() => fn());
    if (evt === 'close') closeListeners.push(() => fn());
    return fakeRes;
  },
  end(payload?: string | Buffer) {
    resolveFn({ status: fakeRes.statusCode, body: payload ? String(payload) : '', headers });
    for (const fn of finishListeners) fn();
    for (const fn of closeListeners) fn();
    return fakeRes;
  },
} as unknown as ServerResponse;
  return { res: fakeRes, read: () => done };
}

async function call(url: string, method = 'GET', origin?: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  const headers: Record<string, string> = { 'x-forwarded-for': '198.51.100.99' };
  if (origin) headers['origin'] = origin;
  const req = { method, url, headers, socket: { remoteAddress: '198.51.100.99' }, on: () => {} } as unknown as IncomingMessage;
  const { res, read } = makeRes();
  await Promise.race([
    handleHttp(req, res),
    new Promise((resolve) => setTimeout(resolve, 600)),
  ]);
  return read();
}

console.log('[metrics-smoke] A) hit /healthz a few times to populate histogram...');
for (let i = 0; i < 5; i++) await call('/healthz');

console.log('[metrics-smoke] B) hit /metrics endpoint...');
const r = await call('/metrics');
console.log(`  → status=${r.status} content-type=${r.headers['Content-Type']} body.length=${r.body.length}`);

console.log('[metrics-smoke] C) check histograms recorded...');
const out = renderMetrics();
const httpHistogram = out.split('\n').filter((l) => l.includes('radar_http_request_duration_ms_bucket')).slice(0, 5);
const counters = out.split('\n').filter((l) => l.includes('radar_http_requests_total')).slice(0, 3);
console.log(`  → ${httpHistogram.length} histogram buckets:`);
for (const line of httpHistogram) console.log(`    ${line}`);
console.log(`  → ${counters.length} counters:`);
for (const line of counters) console.log(`    ${line}`);

console.log('[metrics-smoke] all checks done');
process.exit(0);