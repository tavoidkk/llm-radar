const DEFAULT_BACKEND = 'https://llm-radar-backend.onrender.com';

function normalizeBase(raw: string | undefined, envKey: string, fallback: string): string {
  const value = raw?.trim();
  if (!value) {
    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      console.warn(`[backend-url] ${envKey} no está configurada; usando fallback ${fallback}`);
    }
    return fallback;
  }
  return value.replace(/\/+$/, '');
}

export function getHttpBase(): string {
  const shared = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return normalizeBase(
    process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || shared,
    'NEXT_PUBLIC_BACKEND_HTTP_URL',
    DEFAULT_BACKEND,
  );
}

export function getWsBase(): string {
  const shared = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  const raw = (process.env.NEXT_PUBLIC_BACKEND_WS_URL || shared)?.trim();
  if (!raw) {
    const http = getHttpBase();
    const ws = http.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return ws.replace(/\/+$/, '');
  }
  let ws = raw.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return ws.replace(/\/+$/, '');
}
