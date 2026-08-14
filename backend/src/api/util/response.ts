import type { IncomingMessage, ServerResponse } from 'http';

export interface JsonBody {
  [k: string]: unknown;
}

export async function readJson<T extends JsonBody = JsonBody>(_req: IncomingMessage): Promise<T> {
  return {} as T;
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

export function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } });
}