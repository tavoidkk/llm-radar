'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { fetchHistory, type HistoryPointDTO } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface HistoryPanelProps {
  modelId: string;
  modelName: string;
}

export function HistoryPanel({ modelId, modelName }: HistoryPanelProps): JSX.Element {
  const [points, setPoints] = useState<HistoryPointDTO[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    fetchHistory(modelId, 'hour')
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
  }, [modelId]);

  if (status === 'loading') {
    return <p className="text-sm text-ink/60">Loading history for {modelName}…</p>;
  }
  if (status === 'error') {
    return <p role="alert" className="text-sm text-red-400">History error: {error}</p>;
  }
  if (points.length === 0) {
    return <p className="text-sm text-ink/60">No history available yet for {modelName}.</p>;
  }

  const data: ChartData<'line'> = {
    labels: points.map((p) => new Date(p.bucket).toLocaleString()),
    datasets: [
      {
        label: 'Intelligence',
        data: points.map((p) => p.avgEloRating),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.2)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Avg tokens/sec',
        data: points.map((p) => p.avgTokensPerSec),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,0.2)',
        yAxisID: 'y1',
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
      x: { ticks: { color: '#f8fafc', maxRotation: 0 }, grid: { color: 'rgba(248,250,252,0.08)' } },
      y: { type: 'linear', position: 'left', ticks: { color: '#22d3ee' }, grid: { color: 'rgba(248,250,252,0.08)' } },
      y1: { type: 'linear', position: 'right', ticks: { color: '#a78bfa' }, grid: { display: false } },
    },
  };

  return (
    <div className="h-56 w-full" aria-label={`History chart for ${modelName}`}>
      <Line data={data} options={options} />
    </div>
  );
}