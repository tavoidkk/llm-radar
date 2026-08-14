process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(40);
process.env.OPENROUTER_API_KEY = 'sk-or-v1-fake-test-key-1234567890';
process.env.PORT = '18080';
process.env.WS_ALLOWED_ORIGINS = 'http://localhost:3000';

import type { ServerResponse, IncomingMessage } from 'http';

const { handleHttp } = await import('../src/api/router.js');
const { rateLimit, rateLimitReset, getClientKey } = await import('../src/api/middleware/rate-limit.js');

rateLimitReset();

function makeRes(): { res: ServerResponse; read: () => Promise<{ status: number; body: string; headers: Record<string, string> }> } {
  const headers: Record<string, string> = {};
  let resolveFn: (v: { status: number; body: string; headers: Record<string, string> }) => void = () => {};
  const done = new Promise<{ status: number; body: string; headers: Record<string, string> }>((res) => { resolveFn = res; });
  const fakeRes = {
    statusCode: 200,
    setHeader(k: string, v: string) { headers[k] = v; },
    getHeader(k: string) { return headers[k]; },
    on(_evt: string, _fn: (...a: unknown[]) => void) { return fakeRes; },
    end(payload?: string | Buffer) {
      resolveFn({ status: fakeRes.statusCode, body: payload ? String(payload) : '', headers });
      return fakeRes;
    },
  } as unknown as ServerResponse;
  return { res: fakeRes, read: () => done };
}

async function callNoHandler(url: string, method: string, origin?: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  const headers: Record<string, string> = { 'x-forwarded-for': '198.51.100.7' };
  if (origin) headers['origin'] = origin;
  const req = { method, url, headers, socket: { remoteAddress: '198.51.100.7' }, on: () => {} } as unknown as IncomingMessage;
  const { res, read } = makeRes();
  let handlerCalled = false;
  const origHandle = handleHttp;
  const wrappedHandle = async (r: IncomingMessage, s: ServerResponse): Promise<void> => {
    if (handlerCalled) return;
    handlerCalled = true;
  };
  void wrappedHandle;
  await Promise.race([
    handleHttp(req, res),
    new Promise((resolve) => setTimeout(resolve, 800)),
  ]);
  return read();
}

console.log('[http-smoke] A) routes that do NOT invoke supabase (must complete instantly)...');

console.log('  A1) GET /healthz');
const r1 = await callNoHandler('/healthz', 'GET');
console.log(`     → status=${r1.status} body=${r1.body.slice(0, 60)}`);

console.log('  A2) GET /api/nope (404)');
const r2 = await callNoHandler('/api/nope', 'GET');
console.log(`     → status=${r2.status} body=${r2.body.slice(0, 80)}`);

console.log('  A3) GET /api/ai-models/history without modelId (400)');
const r3 = await callNoHandler('/api/ai-models/history', 'GET');
console.log(`     → status=${r3.status} body=${r3.body.slice(0, 80)}`);

console.log('  A4) OPTIONS /api/ai-models/top from allowed origin');
const r4 = await callNoHandler('/api/ai-models/top', 'OPTIONS', 'http://localhost:3000');
console.log(`     → status=${r4.status} cors-origin=${r4.headers['Access-Control-Allow-Origin'] ?? 'none'}`);

console.log('[http-smoke] B) rate-limit middleware in isolation (45 req/min)...');

rateLimitReset();
const fakeReq = {
  method: 'GET',
  url: '/api/ai-models/top',
  headers: { 'x-forwarded-for': '198.51.100.7' },
  socket: { remoteAddress: '198.51.100.7' },
  on: () => {},
} as unknown as IncomingMessage;

let blocked = false;
let lastResult = null;
for (let i = 1; i <= 50; i++) {
  const result = rateLimit(fakeReq, 45);
  if (!result.allowed) {
    blocked = true;
    console.log(`     → 429 simulated at request #${i}: remaining=${result.remaining} retryAfter=${result.retryAfterMs}ms`);
    lastResult = result;
    break;
  }
}
if (!blocked) console.log('     → FAIL: rate limit never triggered');

console.log('[http-smoke] C) client key extraction');
const reqA = { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, socket: { remoteAddress: '9.9.9.9' } } as unknown as IncomingMessage;
const reqB = { headers: {}, socket: { remoteAddress: '9.9.9.9' } } as unknown as IncomingMessage;
const keyA = getClientKey(reqA);
const keyB = getClientKey(reqB);
console.log(`     XFF chain key=${keyA} (expected: 1.1.1.1)`);
console.log(`     socket-only key=${keyB} (expected: 9.9.9.9)`);

console.log('[http-smoke] all checks done');
process.exit(0);