import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { RadarEvent } from '@llm-radar/types';
import { verifyOrigin } from './origin-guard.js';
import { sendTo } from './broadcaster.js';
import { cache } from '../services/cache.js';
import { incWsConnections, incWsRejected, setCacheSize } from '../observability/metrics.js';

export function createWsServer(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const decision = verifyOrigin(req);
    if (!decision.ok) {
      console.warn(`[ws] rejected origin=${decision.origin} (${decision.reason})`);
      incWsRejected(decision.reason);
      ws.close(1008, 'Origin not allowed');
      return;
    }
    incWsConnections();
    console.log(`[ws] client connected (${decision.reason}) total=${wss.clients.size}`);

    const snapshot: RadarEvent = {
      type: 'snapshot',
      emittedAt: new Date().toISOString(),
      payload: cache.snapshot(),
    };
    sendTo(ws, snapshot);
    setCacheSize(cache.size());

    ws.on('message', (raw) => {
      try {
        const text = raw.toString();
        if (text.length > 16_384) {
          ws.close(1009, 'Message too big');
          return;
        }
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && parsed.type === 'ping') {
          const first = cache.snapshot()[0];
          const tick: RadarEvent = first
            ? { type: 'tick', emittedAt: new Date().toISOString(), payload: first }
            : { type: 'error', emittedAt: new Date().toISOString(), payload: { error: 'no-data' } };
          sendTo(ws, tick);
        }
      } catch {
        ws.close(1003, 'Invalid JSON');
      }
    });

    ws.on('close', () => {
      console.log(`[ws] client disconnected total=${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[ws] socket error:', err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[ws] server error:', err.message);
  });

  return wss;
}