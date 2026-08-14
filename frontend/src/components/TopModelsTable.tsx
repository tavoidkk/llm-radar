'use client';

import { useMemo } from 'react';
import { Sparkline } from '@/components/Sparkline';
import { ProviderLogo } from '@/components/ProviderLogo';
import { rankingLabel, type RadarFilters } from '@/lib/tiers';
import { formatUsdPer1M } from '@/lib/format';
import type { TopModelRow, HistoryPointDTO } from '@/lib/api';

export interface TopModelsTableProps {
  rows: TopModelRow[];
  trends: Record<string, HistoryPointDTO[]>;
  totalRows: number;
  filters: RadarFilters;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  selectedModelId: string | null;
  onSelectModel: (modelId: string) => void;
}

export function TopModelsTable({ rows, trends, totalRows, filters, status, error, selectedModelId, onSelectModel }: TopModelsTableProps): JSX.Element {
  const activeRanking = useMemo(() => rankingLabel(filters), [filters]);

  if (status === 'loading') return <p className="text-sm text-ink/60">Loading models…</p>;
  if (status === 'error') return <p role="alert" className="text-sm text-red-400">Failed: {error}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-ink/15 bg-surface">
      <table className="w-full text-sm">
        <caption className="px-4 py-2 text-left text-ink/70">{activeRanking ?? `Top ${rows.length} models by intelligence`}</caption>
        <thead className="bg-bg/60 text-xs uppercase tracking-wide text-ink/60">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">Model</th>
            <th scope="col" className="px-4 py-2 text-left">Provider</th>
            <th scope="col" className="px-4 py-2 text-left">Category</th>
            <th scope="col" className="px-4 py-2 text-right">Intelligence</th>
            <th scope="col" className="px-4 py-2 text-right">t/s</th>
            <th scope="col" className="px-4 py-2 text-right">$ in/1M</th>
            <th scope="col" className="px-4 py-2 text-right">$ out/1M</th>
            <th scope="col" className="px-4 py-2 text-left">Trend (7d)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isSelected = r.model_id === selectedModelId;
            return (
              <tr
                key={r.model_id}
                onClick={() => onSelectModel(r.model_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectModel(r.model_id);
                  }
                }}
                tabIndex={0}
                aria-pressed={isSelected}
                className={`cursor-pointer border-t border-ink/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  isSelected ? 'bg-accent/15 ring-1 ring-inset ring-accent' : 'hover:bg-bg/60'
                }`}
              >
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2">
                    <ProviderLogo provider={r.provider} name={r.name} />
                    <span className="font-medium">{r.name}</span>
                  </span>
                  <span className="ml-2 text-xs text-ink/50">{r.model_id}</span>
                </td>
                <td className="px-4 py-2">{r.provider}</td>
                <td className="px-4 py-2 capitalize">{r.category}</td>
                <td className="px-4 py-2 text-right font-semibold">{Number(r.elo_rating).toFixed(0)}</td>
                <td className="px-4 py-2 text-right">{Number(r.tokens_per_sec).toFixed(0)}</td>
                <td className="px-4 py-2 text-right">{formatUsdPer1M(Number(r.cost_input))}</td>
                <td className="px-4 py-2 text-right">{formatUsdPer1M(Number(r.cost_output))}</td>
                <td className="px-4 py-2"><Sparkline points={trends[r.model_id]} modelName={r.name} /></td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-ink/50">
                No models match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="border-t border-ink/10 px-4 py-2 text-xs text-ink/50">
        {rows.length} of {totalRows} rows shown (top 30) · last updated {rows[0] ? new Date(rows[0].ts).toLocaleString() : '—'}
      </p>
    </div>
  );
}
