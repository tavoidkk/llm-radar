import { useEffect, useRef, useState, useCallback } from 'react';
import type { MetricPayload, RadarEvent } from '@llm-radar/types';

export type RadarStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface UseRadarSocketResult {
  status: RadarStatus;
  latest: MetricPayload | null;
  history: MetricPayload[];
  error: string | null;
  liveMessage: string | null;
}

export function useRadarSocket(url: string): UseRadarSocketResult {
  const [status, setStatus] = useState<RadarStatus>('connecting');
  const [latest, setLatest] = useState<MetricPayload | null>(null);
  const [history, setHistory] = useState<MetricPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus('connecting');

      ws.onopen = () => {
        setStatus('open');
        setError(null);
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(String(ev.data)) as RadarEvent;
          if (event.type === 'snapshot') {
            setHistory(Array.isArray(event.payload) ? event.payload : []);
            setLatest(Array.isArray(event.payload) && event.payload[0] ? event.payload[0] : null);
          } else if (event.type === 'tick') {
            const m = event.payload as MetricPayload;
            setLatest(m);
            setHistory((prev) => {
              const next = prev.filter((p) => p.modelId !== m.modelId);
              next.unshift(m);
              if (next.length > 500) next.length = 500;
              return next;
            });
            setLiveMessage(`${m.modelId} → elo ${m.eloRating.toFixed(0)} • ${m.tokensPerSec.toFixed(0)} t/s • $${m.costOutput.toFixed(4)}/1k`);
          } else if (event.type === 'error') {
            setError(event.payload.error);
          }
        } catch {
          setError('Bad message format');
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setError('WebSocket error');
      };

      ws.onclose = () => {
        setStatus('closed');
        reconnectRef.current = window.setTimeout(connect, 3000);
      };
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
      reconnectRef.current = window.setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current !== null) window.clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, latest, history, error, liveMessage };
}