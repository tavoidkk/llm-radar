import type { ModelCategory } from '@llm-radar/types';

export interface RadarFilters {
  categories: Set<ModelCategory>;
  speed: boolean;
  cost: boolean;
  intel: boolean;
}

export const RANKING_TOP_N = 10;

export interface Rankable {
  modelId: string;
  category: ModelCategory;
  eloRating: number;
  tokensPerSec: number;
  costOutputPer1k: number;
}

export function topNBySpeed(items: readonly Rankable[], n: number): Set<string> {
  return new Set(
    [...items]
      .sort((a, b) => b.tokensPerSec - a.tokensPerSec)
      .slice(0, n)
      .map((i) => i.modelId),
  );
}

export function topNByCost(items: readonly Rankable[], n: number): Set<string> {
  return new Set(
    [...items]
      .sort((a, b) => a.costOutputPer1k - b.costOutputPer1k)
      .slice(0, n)
      .map((i) => i.modelId),
  );
}

export function topNByElo(items: readonly Rankable[], n: number): Set<string> {
  return new Set(
    [...items]
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, n)
      .map((i) => i.modelId),
  );
}

export function applyRankings(items: readonly Rankable[], filters: RadarFilters, n = RANKING_TOP_N): readonly Rankable[] {
  const byCategory: readonly Rankable[] =
    filters.categories.size > 0 ? items.filter((i) => filters.categories.has(i.category)) : items;

  const sets: Set<string>[] = [];
  if (filters.speed) sets.push(topNBySpeed(byCategory, n));
  if (filters.cost) sets.push(topNByCost(byCategory, n));
  if (filters.intel) sets.push(topNByElo(byCategory, n));

  if (sets.length === 0) return byCategory;

  let allowed: Set<string> | undefined;
  for (const set of sets) {
    if (allowed === undefined) {
      allowed = new Set(set);
      continue;
    }
    const next = new Set<string>();
    for (const id of allowed) {
      if (set.has(id)) next.add(id);
    }
    allowed = next;
  }
  if (allowed === undefined) return byCategory;
  return byCategory.filter((i) => allowed.has(i.modelId));
}

export function rankingLabel(filters: RadarFilters): string | null {
  const parts: string[] = [];
  if (filters.speed) parts.push('fastest');
  if (filters.cost) parts.push('cheapest');
  if (filters.intel) parts.push('smartest');
  if (parts.length === 0) return null;
  return `Top ${RANKING_TOP_N} ${parts.join(' · ')}`;
}

export function rankingComparator(filters: RadarFilters): (a: Rankable, b: Rankable) => number {
  if (filters.speed) return (a, b) => b.tokensPerSec - a.tokensPerSec;
  if (filters.cost) return (a, b) => a.costOutputPer1k - b.costOutputPer1k;
  return (a, b) => b.eloRating - a.eloRating;
}