'use client';

import { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import type { ModelCategory } from '@llm-radar/types';
import type { TopModelRow } from '@/lib/api';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

const CATEGORY_LABEL: Record<ModelCategory, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  flash: 'Flash',
  multimodal: 'Multimodal',
};

const CATEGORY_COLOR: Record<ModelCategory, string> = {
  reasoning: '#22d3ee',
  coding: '#a78bfa',
  flash: '#34d399',
  multimodal: '#f472b6',
};

interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  labelId: string;
}

export interface ScatterChartProps {
  rows: TopModelRow[];
  selectedModelId?: string | null;
  onClickModel?: (modelId: string) => void;
}

export function ScatterChart({ rows, selectedModelId, onClickModel }: ScatterChartProps): JSX.Element {
  const data: ChartData<'scatter'> = useMemo(() => {
    const datasets: ChartData<'scatter'>['datasets'] = (Object.keys(CATEGORY_LABEL) as ModelCategory[]).map((cat) => {
      const points: ScatterPoint[] = rows
        .filter((r) => r.category === cat)
        .map((r) => ({
          x: Number(r.cost_output) * 1000,
          y: Number(r.elo_rating),
          label: r.name,
          labelId: r.model_id,
        }));
      return {
        label: CATEGORY_LABEL[cat],
        data: points,
        backgroundColor: CATEGORY_COLOR[cat],
        borderColor: CATEGORY_COLOR[cat],
        pointRadius: points.map((p) => 6 + (p.labelId === selectedModelId ? 3 : 0)),
        pointHoverRadius: points.map(() => 10),
        pointBorderColor: points.map((p) => (p.labelId === selectedModelId ? '#f8fafc' : CATEGORY_COLOR[cat])),
        pointBorderWidth: points.map((p) => (p.labelId === selectedModelId ? 3 : 1)),
      };
    });
    return { datasets };
  }, [rows, selectedModelId]);

  const options: ChartOptions<'scatter'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: '#f8fafc' } },
        title: {
          display: true,
          text: 'Cost vs Intelligence',
          color: '#f8fafc',
          font: { size: 16, weight: 'bold' },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const raw = ctx.raw as ScatterPoint | undefined;
              const name = raw?.label ?? '';
              const cost = Number(ctx.parsed.x).toFixed(2);
              const elo = Number(ctx.parsed.y).toFixed(0);
              return `${name}: $${cost}/1M • elo ${elo}`;
            },
          },
        },
      },
      onClick: (_evt, elements) => {
        if (!onClickModel) return;
        const el = elements[0];
        if (!el) return;
        const ds = data.datasets[el.datasetIndex];
        const raw = ds?.data[el.index] as unknown as ScatterPoint | undefined;
        if (raw?.labelId) onClickModel(raw.labelId);
      },
      scales: {
        x: {
          title: { display: true, text: 'Cost output (USD / 1M tokens)', color: '#f8fafc' },
          ticks: { color: '#f8fafc' },
          grid: { color: 'rgba(248,250,252,0.08)' },
        },
        y: {
          title: { display: true, text: 'Intelligence', color: '#f8fafc' },
          ticks: { color: '#f8fafc' },
          grid: { color: 'rgba(248,250,252,0.08)' },
        },
      },
    }),
    [onClickModel, data],
  );

  const top5 = useMemo(() => {
    return [...rows]
      .sort((a, b) => Number(b.elo_rating) - Number(a.elo_rating))
      .slice(0, 5)
      .map((r) => ({ id: r.model_id, name: r.name, elo: Number(r.elo_rating), tps: Number(r.tokens_per_sec) }));
  }, [rows]);

  return (
    <div>
      <div className="h-[420px] w-full">
        <Scatter
          data={data}
          options={options}
          aria-label="Scatter chart of cost per million tokens versus intelligence"
          role="img"
        />
      </div>
      <table className="sr-only">
        <caption>Top 5 models by intelligence</caption>
        <thead>
          <tr><th>Model</th><th>Intelligence</th><th>Tokens/sec</th></tr>
        </thead>
        <tbody>
          {top5.map((m) => (
            <tr key={m.id}><td>{m.name}</td><td>{m.elo.toFixed(0)}</td><td>{m.tps.toFixed(0)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
