import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { env, allowedOrigins } from './config/env.js';
import { handleHttp } from './api/router.js';
import { createWsServer } from './ws/server.js';
import { verifyOrigin } from './ws/origin-guard.js';
import type { IncomingMessage } from 'http';

export function startHttpServer(): { http: ReturnType<typeof createServer>; wss: WebSocketServer } {
  const httpServer = createServer((req, res) => {
    void handleHttp(req, res);
  });

  const wss = createWsServer();

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const decision = verifyOrigin(req);
    if (!decision.ok) {
      console.warn(`[http] upgrade rejected origin=${decision.origin} (${decision.reason})`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  httpServer.listen(env.PORT, () => {
    console.log(`[http] listening on :${env.PORT} (origins: ${allowedOrigins().join(',')})`);
  });

  return { http: httpServer, wss };
}

export function closeHttpServer(http: ReturnType<typeof createServer>, wss: WebSocketServer): Promise<void> {
  return new Promise((resolve) => {
    wss.close();
    http.close(() => resolve());
  });
}