import { env } from './config/env.js';
import { getSupabase } from './config/supabase.js';
import { startHttpServer, closeHttpServer } from './server.js';
import { createPoller } from './services/poller.js';
import { batcher } from './services/batcher.js';
import type { RadarEvent } from '@llm-radar/types';

async function bootstrap(): Promise<void> {
  console.log('[boot] env', {
    port: env.PORT,
    poll: env.POLL_INTERVAL_MS,
    batch: env.BATCH_INTERVAL_MS,
    origins: env.WS_ALLOWED_ORIGINS,
  });

  const supabase = getSupabase();
  const { error: pingErr } = await supabase.from('v_latest_metrics').select('model_id').limit(1);
  if (pingErr) {
    console.warn('[boot] Supabase ping failed (will continue with cache-only):', pingErr.message);
  } else {
    console.log('[boot] Supabase reachable');
  }

  const { http, wss } = startHttpServer();
  const poller = createPoller();

  const origEnqueue = batcher.enqueue.bind(batcher);
  batcher.enqueue = (metrics) => {
    origEnqueue(metrics);
    if (metrics.length > 0) {
      const event: RadarEvent = {
        type: 'tick',
        emittedAt: new Date().toISOString(),
        payload: metrics[0]!,
      };
      const payload = JSON.stringify(event);
      for (const client of wss.clients) {
        if (client.readyState === 1) client.send(payload);
      }
    }
  };

  batcher.start();
  poller.start();

  console.log('[boot] Step 3 ready: HTTP routes + WS + OpenRouter poller all running');

  const shutdown = async (sig: string): Promise<void> => {
    console.log(`[boot] ${sig} received, shutting down...`);
    poller.stop();
    batcher.stop();
    await closeHttpServer(http, wss);
    process.exit(0);
  };

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
}

bootstrap().catch((err: unknown) => {
  console.error('[boot] fatal:', err);
  process.exit(1);
});