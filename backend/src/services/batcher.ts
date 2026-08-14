import type { MetricPayload } from '@llm-radar/types';
import { env } from '../config/env.js';
import { getSupabase } from '../config/supabase.js';
import { incBatcherInserted } from '../observability/metrics.js';

export interface BatcherHandle {
  enqueue(metrics: readonly MetricPayload[]): void;
  flush(): Promise<void>;
  start(): void;
  stop(): void;
}

class MetricBatcher implements BatcherHandle {
  private buffer: MetricPayload[] = [];
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private flushing: Promise<void> | undefined;

  enqueue(metrics: readonly MetricPayload[]): void {
    for (const m of metrics) this.buffer.push(m);
  }

  async flush(): Promise<void> {
    if (this.flushing) {
      await this.flushing;
      return;
    }
    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];

    this.flushing = (async () => {
      const supabase = getSupabase();
      const rows = batch.map((m) => ({
        model_id: m.modelId,
        elo_rating: m.eloRating,
        tokens_per_sec: m.tokensPerSec,
        cost_input: m.costInput,
        cost_output: m.costOutput,
        latency_ms: m.latencyMs ?? null,
        source: m.source,
        timestamp: m.timestamp,
      }));

      const CHUNK = 500;
      let inserted = 0;
      let lastError: string | undefined;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { error } = await supabase.from('metrics').insert(slice);
        if (error) {
          lastError = error.message;
        } else {
          inserted += slice.length;
        }
      }
      incBatcherInserted(inserted);
      if (lastError) {
        console.warn(`[batcher] partial insert: ok=${inserted}/${rows.length} lastErr=${lastError}`);
      } else {
        console.log(`[batcher] inserted ${inserted}/${rows.length} rows`);
      }
    })();

    try {
      await this.flushing;
    } finally {
      this.flushing = undefined;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => {
      void this.flush();
    }, env.BATCH_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.running = false;
  }
}

export const batcher: BatcherHandle = new MetricBatcher();