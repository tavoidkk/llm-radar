'use client';

export interface RankingFilterProps {
  speed: boolean;
  cost: boolean;
  intel: boolean;
  onToggleSpeed: () => void;
  onToggleCost: () => void;
  onToggleIntel: () => void;
}

function Chip({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      style={{
        backgroundColor: active ? '#22d3ee' : '#1f2937',
        color: active ? '#0b0f17' : '#f8fafc',
        border: '2px solid',
        borderColor: active ? '#22d3ee' : 'rgba(248,250,252,0.2)',
      }}
    >
      {label}
    </button>
  );
}

export function RankingFilter({ speed, cost, intel, onToggleSpeed, onToggleCost, onToggleIntel }: RankingFilterProps): JSX.Element {
  return (
    <div role="group" aria-label="Rank by top models" className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-ink/60">Ranking</span>
      <Chip active={speed} label="Top 10 fastest" onToggle={onToggleSpeed} />
      <Chip active={cost} label="Top 10 cheapest" onToggle={onToggleCost} />
      <Chip active={intel} label="Top 10 smartest" onToggle={onToggleIntel} />
    </div>
  );
}