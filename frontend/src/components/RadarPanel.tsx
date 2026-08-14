'use client';

import { useMemo, useCallback } from 'react';
import type { AiModel } from '@llm-radar/types';
import type { TopModelRow } from '@/lib/api';
import { ScatterChart } from '@/components/ScatterChart';
import { ModelSidePanel } from '@/components/ModelSidePanel';

export interface RadarPanelProps {
  visibleTopModels: TopModelRow[];
  selectedModelId: string | null;
  onSelectModel: (modelId: string) => void;
}

export function RadarPanel({ visibleTopModels, selectedModelId, onSelectModel }: RadarPanelProps): JSX.Element {
  const modelsIndex = useMemo<Record<string, AiModel>>(() => {
    const idx: Record<string, AiModel> = {};
    for (const row of visibleTopModels) {
      idx[row.model_id] = {
        id: row.model_id,
        name: row.name,
        provider: row.provider,
        category: row.category,
        contextWindow: row.context_window,
        homepageUrl: row.homepage_url,
        maxOutputTokens: row.max_output_tokens,
        inputModalities: row.input_modalities ?? [],
        outputModalities: row.output_modalities ?? [],
        modality: row.modality,
      };
    }
    return idx;
  }, [visibleTopModels]);

  const onChartClick = useCallback(
    (modelId: string) => onSelectModel(modelId),
    [onSelectModel],
  );

  const selected = useMemo(() => {
    if (!selectedModelId) return null;
    const row = visibleTopModels.find((r) => r.model_id === selectedModelId);
    if (!row) return null;
    const model = modelsIndex[selectedModelId];
    return {
      model,
      metric: {
        modelId: row.model_id,
        eloRating: Number(row.elo_rating),
        tokensPerSec: Number(row.tokens_per_sec),
        costInput: Number(row.cost_input),
        costOutput: Number(row.cost_output),
        source: 'openrouter' as const,
        timestamp: row.ts,
      },
    };
  }, [selectedModelId, visibleTopModels, modelsIndex]);

  const lastUpdated = visibleTopModels[0]?.ts ?? null;

  return (
    <section className="space-y-6" aria-labelledby="radar-heading">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="radar-heading" className="text-xl font-semibold">Live radar</h2>
          <p className="text-sm text-ink/60">{visibleTopModels.length} models · {lastUpdated ? `updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'no data'}</p>
        </div>
      </header>

      <ScatterChart
        rows={visibleTopModels}
        selectedModelId={selectedModelId}
        onClickModel={onChartClick}
      />

      {selected && selected.model && (
        <ModelSidePanel
          model={selected.model}
          metric={selected.metric}
          onClose={() => onSelectModel('')}
        />
      )}
    </section>
  );
}