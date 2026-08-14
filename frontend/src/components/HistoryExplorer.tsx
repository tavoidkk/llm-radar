'use client';

import { useEffect, useState } from 'react';
import { fetchHistory, type HistoryPointDTO } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export function HistoryExplorer(): JSX.Element {
  const [modelId, setModelId] = useState('openai/gpt-4o');
  const [bucket, setBucket] = useState<'hour' | 'day'>('hour');
  const [points, setPoints] = useState<HistoryPointDTO[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) return;
    let cancelled = false;
    setStatus('loading');
    setError(null);
    fetchHistory(modelId, bucket)
      .then((pts) => {
        if (cancelled) return;
        setPoints(pts);
        setStatus('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [modelId, bucket]);

  const data: ChartData<'line'> = {
    labels: points.map((p) => new Date(p.bucket).toLocaleString()),
    datasets: [
      {
        label: 'Intelligence',
        data: points.map((p) => p.avgEloRating),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.2)',
        fill: true,
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Tokens/sec',
        data: points.map((p) => p.avgTokensPerSec),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,0.2)',
        yAxisID: 'y1',
        tension: 0.3,
      },
      {
        label: 'Cost out (×10)',
        data: points.map((p) => p.avgCostOutput * 10),
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244,114,182,0.15)',
        yAxisID: 'y2',
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: '#f8fafc' } } },
    scales: {
      x: { ticks: { color: '#f8fafc' }, grid: { color: 'rgba(248,250,252,0.08)' } },
      y: { type: 'linear', position: 'left', ticks: { color: '#22d3ee' }, title: { display: true, text: 'Intelligence', color: '#22d3ee' } },
      y1: { type: 'linear', position: 'right', ticks: { color: '#a78bfa' }, grid: { display: false }, title: { display: true, text: 't/s', color: '#a78bfa' } },
      y2: { type: 'linear', position: 'right', display: false },
    },
  };

  return (
    <section className="space-y-4" aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-xl font-semibold">Historical mode</h2>
      <p className="text-sm text-ink/70">
        Inspect the evolution of a model's metrics across time buckets. Data is aggregated server-side via Postgres <code>date_trunc</code> + AVG using the composite index <code>(model_id, timestamp DESC)</code>.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-ink/70">Model ID</span>
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="rounded-md border border-ink/30 bg-bg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            placeholder="openai/gpt-4o"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-ink/70">Bucket</span>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as 'hour' | 'day')}
            className="rounded-md border border-ink/30 bg-bg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
          </select>
        </label>
      </div>

      <div aria-live="polite">
        {status === 'loading' && <p className="text-sm text-ink/60">Loading…</p>}
        {status === 'error' && <p role="alert" className="text-sm text-red-400">Error: {error}</p>}
        {status === 'ready' && points.length === 0 && (
          <p className="text-sm text-ink/60">No data yet for this model. The poller needs a few cycles.</p>
        )}
      </div>

      {status === 'ready' && points.length > 0 && (
        <div className="h-80 w-full">
          <Line data={data} options={options} aria-label={`History for ${modelId}`} />
        </div>
      )}

      <details className="rounded-md border border-ink/15 bg-surface p-3 text-sm">
        <summary className="cursor-pointer font-medium">Raw data ({points.length} buckets)</summary>
        <pre className="mt-2 overflow-auto text-xs text-ink/70">{JSON.stringify(points, null, 2)}</pre>
      </details>
    </section>
  );
}