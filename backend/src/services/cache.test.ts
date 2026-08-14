import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentCache } from './cache.js';
import type { MetricPayload } from '@llm-radar/types';

function m(id: string, ts = '2026-01-01T00:00:00.000Z'): MetricPayload {
  return {
    modelId: id,
    eloRating: 1200,
    tokensPerSec: 80,
    costInput: 0.005,
    costOutput: 0.015,
    source: 'openrouter',
    timestamp: ts,
  };
}

describe('PersistentCache', () => {
  let cache: PersistentCache;

  beforeEach(() => {
    cache = new PersistentCache('/tmp/llm-radar-test-cache.json', 60_000);
  });

  it('stores and retrieves metrics by model id', () => {
    cache.set([m('openai/gpt-4o'), m('anthropic/claude-3-5-sonnet')]);
    expect(cache.size()).toBe(2);
    expect(cache.get('openai/gpt-4o')?.modelId).toBe('openai/gpt-4o');
  });

  it('overwrites existing entry on duplicate set', () => {
    cache.set([m('a', '2026-01-01T00:00:00.000Z')]);
    cache.set([m('a', '2026-01-02T00:00:00.000Z')]);
    expect(cache.size()).toBe(1);
    expect(cache.get('a')?.timestamp).toBe('2026-01-02T00:00:00.000Z');
  });

  it('snapshot returns all values', () => {
    cache.set([m('x'), m('y'), m('z')]);
    const snap = cache.snapshot();
    expect(snap.length).toBe(3);
    expect(snap.map((p) => p.modelId).sort()).toEqual(['x', 'y', 'z']);
  });

  it('clear removes everything', () => {
    cache.set([m('x')]);
    expect(cache.size()).toBe(1);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('persists to disk atomically (tmp + rename)', async () => {
    cache.set([m('persist/a'), m('persist/b')]);
    await cache.flushNow();
    const fresh = new PersistentCache('/tmp/llm-radar-test-cache.json', 60_000);
    await fresh.load();
    expect(fresh.size()).toBe(2);
    expect(fresh.get('persist/a')?.modelId).toBe('persist/a');
  });
});