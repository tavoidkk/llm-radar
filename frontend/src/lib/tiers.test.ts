import { describe, it, expect } from 'vitest';
import {
  applyRankings,
  rankingComparator,
  rankingLabel,
  topNByCost,
  topNByElo,
  topNBySpeed,
  RANKING_TOP_N,
  type RadarFilters,
  type Rankable,
} from './tiers';

const empty: RadarFilters = {
  categories: new Set(),
  speed: false,
  cost: false,
  intel: false,
};

function make(id: string, elo: number, tps: number, cost: number, category: Rankable['category'] = 'reasoning'): Rankable {
  return { modelId: id, category, eloRating: elo, tokensPerSec: tps, costOutputPer1k: cost };
}

const ITEMS: Rankable[] = [
  make('a', 1300, 50, 0.02),
  make('b', 1250, 200, 0.01),
  make('c', 1400, 90, 0.05),
  make('d', 1150, 160, 0.001),
];

describe('RANKING_TOP_N', () => {
  it('defaults to 10', () => {
    expect(RANKING_TOP_N).toBe(10);
  });
});

describe('topNBySpeed', () => {
  it('sorts by tokens per sec descending', () => {
    expect([...topNBySpeed(ITEMS, 2)]).toEqual(['b', 'd']);
  });
});

describe('topNByCost', () => {
  it('sorts by cost ascending', () => {
    expect([...topNByCost(ITEMS, 2)]).toEqual(['d', 'b']);
  });
});

describe('topNByElo', () => {
  it('sorts by elo descending', () => {
    expect([...topNByElo(ITEMS, 2)]).toEqual(['c', 'a']);
  });
});

describe('applyRankings', () => {
  it('returns everything when no ranking is active', () => {
    expect(applyRankings(ITEMS, empty)).toHaveLength(ITEMS.length);
  });

  it('returns the top-N by the active ranking', () => {
    const fastest = applyRankings(ITEMS, { ...empty, speed: true }, 2);
    expect(fastest.map((i) => i.modelId)).toEqual(['b', 'd']);
  });

  it('intersects independent rankings with AND semantics', () => {
    const both = applyRankings(ITEMS, { ...empty, speed: true, intel: true }, 3);
    expect(both.map((i) => i.modelId)).toEqual(['b', 'c']);
  });

  it('applies the category filter before ranking', () => {
    const flash: Rankable[] = [
      make('f1', 1200, 180, 0.01, 'flash'),
      make('f2', 1100, 90, 0.02, 'flash'),
      make('r1', 1300, 60, 0.01, 'reasoning'),
    ];
    const result = applyRankings(flash, { ...empty, categories: new Set(['flash']), speed: true }, 1);
    expect(result.map((i) => i.modelId)).toEqual(['f1']);
  });

  it('returns an empty list when intersection is empty', () => {
    const result = applyRankings(ITEMS, { ...empty, speed: true, cost: true }, 1);
    expect(result).toEqual([]);
  });
});

describe('rankingLabel', () => {
  it('returns null when nothing is active', () => {
    expect(rankingLabel(empty)).toBeNull();
  });
  it('describes the active rankings', () => {
    expect(rankingLabel({ ...empty, speed: true })).toBe('Top 10 fastest');
    expect(rankingLabel({ ...empty, speed: true, cost: true })).toBe('Top 10 fastest · cheapest');
  });
});

describe('rankingComparator', () => {
  it('sorts by the active dimension', () => {
    expect(rankingComparator({ ...empty, speed: true })(ITEMS[0]!, ITEMS[1]!)).toBeGreaterThan(0);
    expect(rankingComparator({ ...empty, cost: true })(ITEMS[0]!, ITEMS[1]!)).toBeGreaterThan(0);
    expect(rankingComparator(empty)(ITEMS[0]!, ITEMS[2]!)).toBeGreaterThan(0);
  });
});