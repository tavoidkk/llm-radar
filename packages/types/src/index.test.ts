import { describe, it, expect } from 'vitest';
import { CATEGORIES, type ModelCategory, type RadarEvent } from './index.js';

describe('@llm-radar/types', () => {
  it('exports the 4 categories from the SRS plus multimodal', () => {
    expect(CATEGORIES).toEqual(['reasoning', 'coding', 'flash', 'multimodal']);
  });

  it('narrows ModelCategory via type guard', () => {
    const c: ModelCategory = 'multimodal';
    expect(['reasoning', 'coding', 'flash', 'multimodal'].includes(c)).toBe(true);
  });

  it('discriminates RadarEvent by type', () => {
    const snap: RadarEvent = { type: 'snapshot', emittedAt: '2026-01-01T00:00:00.000Z', payload: [] };
    const tick: RadarEvent = {
      type: 'tick',
      emittedAt: '2026-01-01T00:00:01.000Z',
      payload: {
        modelId: 'x',
        eloRating: 1000,
        tokensPerSec: 50,
        costInput: 0.001,
        costOutput: 0.002,
        source: 'openrouter',
        timestamp: '2026-01-01T00:00:01.000Z',
      },
    };
    const err: RadarEvent = { type: 'error', emittedAt: '2026-01-01T00:00:02.000Z', payload: { error: 'oops' } };
    expect(snap.type).toBe('snapshot');
    expect(tick.type).toBe('tick');
    expect(err.type).toBe('error');
  });
});