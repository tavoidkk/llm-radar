'use client';

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
import type { HistoryPointDTO } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export function Sparkline({ points, modelName }: { points: HistoryPointDTO[] | undefined; modelName: string }): JSX.Element {
  if (!points || points.length === 0) {
    return <span className="text-xs text-ink/40" aria-label={`No history for ${modelName}`}>—</span>;
  }

  const data: ChartData<'line'> = {
    labels: points.map((p) => new Date(p.bucket).toLocaleString()),
    datasets: [
      {
        data: points.map((p) => p.avgEloRating),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: false,
  };

  return (
    <div
      className="h-12 w-32"
      role="img"
      aria-label={`Intelligence trend for ${modelName}: ${points.length} samples`}
    >
      <Line data={data} options={options} />
    </div>
  );
}