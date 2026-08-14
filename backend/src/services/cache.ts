import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { MetricPayload } from '@llm-radar/types';

const DEFAULT_PATH = process.env['METRICS_CACHE_PATH'] ?? path.resolve(process.cwd(), '.cache', 'metrics-cache.json');

interface PersistedShape {
  version: 1;
  savedAt: string;
  entries: Array<[string, MetricPayload]>;
}

export class PersistentCache {
  private dirty = false;
  private flushTimer: NodeJS.Timeout | undefined;
  private map = new Map<string, MetricPayload>();

  constructor(private readonly filePath: string = DEFAULT_PATH, private readonly flushIntervalMs = 5_000) {}

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedShape;
      if (parsed.version === 1 && Array.isArray(parsed.entries)) {
        this.map = new Map(parsed.entries);
      }
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code !== 'ENOENT') {
        console.warn('[cache] load failed:', e.message);
      }
    }
  }

  set(metrics: readonly MetricPayload[]): void {
    for (const m of metrics) this.map.set(m.modelId, m);
    this.dirty = true;
    this.scheduleFlush();
  }

  get(modelId: string): MetricPayload | undefined {
    return this.map.get(modelId);
  }

  snapshot(): MetricPayload[] {
    return Array.from(this.map.values());
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.dirty = true;
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      void this.flushNow();
    }, this.flushIntervalMs);
  }

  async flushNow(): Promise<void> {
    if (!this.dirty) return;
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const payload: PersistedShape = {
      version: 1,
      savedAt: new Date().toISOString(),
      entries: Array.from(this.map.entries()),
    };
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(payload), 'utf-8');
    await fs.rename(tmp, this.filePath);
    this.dirty = false;
  }
}

export const cache = new PersistentCache();
void cache.load().then(() => {
  console.log(`[cache] loaded ${cache.size()} entries from disk`);
});