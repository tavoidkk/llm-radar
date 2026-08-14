import type { WebSocket, WebSocketServer } from 'ws';
import type { RadarEvent } from '@llm-radar/types';

export function broadcast(wss: WebSocketServer, event: RadarEvent): number {
  const payload = JSON.stringify(event);
  let sent = 0;
  for (const client of wss.clients) {
    if (isOpen(client)) {
      client.send(payload);
      sent++;
    }
  }
  return sent;
}

export function sendTo(client: WebSocket, event: RadarEvent): void {
  if (isOpen(client)) {
    client.send(JSON.stringify(event));
  }
}

function isOpen(ws: WebSocket): boolean {
  return ws.readyState === 1;
}