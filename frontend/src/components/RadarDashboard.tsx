'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetricPayload, ModelCategory } from '@llm-radar/types';
import { RadarPanel } from '@/components/RadarPanel';
import { TopModelsTable } from '@/components/TopModelsTable';
import { CategoryFilter } from '@/components/CategoryFilter';
import { RankingFilter } from '@/components/RankingFilter';
import { useRadarSocket } from '@/hooks/useRadarSocket';
import { getWsBase } from '@/lib/backend-url';
import { fetchTopModels, fetchTrends, fetchHealth, type TopModelRow, type HistoryPointDTO } from '@/lib/api';
import { applyRankings, rankingComparator, RANKING_TOP_N, type RadarFilters } from '@/lib/tiers';

const TOP_POOL = 100;

export function RadarDashboard(): JSX.Element {
  const [activeCats, setActiveCats] = useState<Set<ModelCategory>>(() => new Set());
  const [speed, setSpeed] = useState(false);
  const [cost, setCost] = useState(false);
  const [intel, setIntel] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [topRows, setTopRows] = useState<TopModelRow[]>([]);
  const [trends, setTrends] = useState<Record<string, HistoryPointDTO[]>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [aaDegraded, setAaDegraded] = useState(false);

  const { status: wsStatus, history: liveMetrics, error: wsError } = useRadarSocket(getWsBase());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetchHealth();
        if (!cancelled) setAaDegraded(!h.aa.ok);
      } catch {
        if (!cancelled) setAaDegraded(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchTopModels({ limit: TOP_POOL });
        if (cancelled) return;
        setTopRows(r);
        setStatus('ready');
        try {
          const t = await fetchTrends(r.map((x) => x.model_id));
          if (!cancelled) setTrends(t);
        } catch (err) {
          console.warn('[RadarDashboard] trends fetch failed:', (err as Error).message);
        }
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onClearAll = useCallback(() => {
    setActiveCats(new Set());
    setSpeed(false);
    setCost(false);
    setIntel(false);
  }, []);

  const onSelectModel = useCallback((id: string) => {
    setSelectedModelId(id);
  }, []);

  const filters = useMemo<RadarFilters>(
    () => ({ categories: activeCats, speed, cost, intel }),
    [activeCats, speed, cost, intel],
  );

  const visibleTopModels = useMemo<TopModelRow[]>(() => {
    if (topRows.length === 0) return [];
    const liveByModel = new Map<string, MetricPayload>();
    for (const m of liveMetrics) liveByModel.set(m.modelId, m);

    const merged = topRows.map((r) => {
      const live = liveByModel.get(r.model_id);
      if (!live) return r;
      return {
        ...r,
        elo_rating: live.eloRating,
        tokens_per_sec: live.tokensPerSec,
        cost_input: live.costInput,
        cost_output: live.costOutput,
        ts: live.timestamp,
      };
    });

    const rankable = merged.map((r) => ({
      modelId: r.model_id,
      category: r.category,
      eloRating: Number(r.elo_rating),
      tokensPerSec: Number(r.tokens_per_sec),
      costOutputPer1k: Number(r.cost_output),
    }));
    const selectedIds = new Set(applyRankings(rankable, filters, RANKING_TOP_N).map((r) => r.modelId));
    const comparator = rankingComparator(filters);
    return merged
      .filter((r) => selectedIds.has(r.model_id))
      .sort((a, b) =>
        comparator(
          {
            modelId: a.model_id,
            category: a.category,
            eloRating: Number(a.elo_rating),
            tokensPerSec: Number(a.tokens_per_sec),
            costOutputPer1k: Number(a.cost_output),
          },
          {
            modelId: b.model_id,
            category: b.category,
            eloRating: Number(b.elo_rating),
            tokensPerSec: Number(b.tokens_per_sec),
            costOutputPer1k: Number(b.cost_output),
          },
        ),
      )
      .slice(0, 30);
  }, [topRows, liveMetrics, filters]);

  return (
    <div className="space-y-10">
      {aaDegraded && (
        <div role="alert" className="rounded-lg border border-red-700 bg-red-950 p-3 text-sm text-red-200">
          Artificial Analysis is unavailable right now, so the ranking shows no data until real metrics arrive.
        </div>
      )}
      {wsStatus === 'error' && (
        <div role="alert" className="rounded-lg border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
          Live updates unavailable ({wsError ?? 'WebSocket error'}). Showing latest HTTP snapshot.
        </div>
      )}
      <div className="space-y-3 rounded-lg border border-ink/15 bg-surface p-4">
        <CategoryFilter
          selected={activeCats}
          onToggle={(c) => setActiveCats((prev) => {
            const next = new Set(prev);
            if (next.has(c)) next.delete(c);
            else next.add(c);
            return next;
          })}
          onClear={onClearAll}
        />
        <RankingFilter
          speed={speed}
          cost={cost}
          intel={intel}
          onToggleSpeed={() => setSpeed((v) => !v)}
          onToggleCost={() => setCost((v) => !v)}
          onToggleIntel={() => setIntel((v) => !v)}
        />
      </div>

      <RadarPanel visibleTopModels={visibleTopModels} selectedModelId={selectedModelId} onSelectModel={onSelectModel} />
      <TopModelsTable
        rows={visibleTopModels}
        trends={trends}
        totalRows={topRows.length}
        filters={filters}
        status={status}
        error={error}
        selectedModelId={selectedModelId}
        onSelectModel={onSelectModel}
      />
    </div>
  );
}
