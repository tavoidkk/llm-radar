'use client';

import { CATEGORIES, type ModelCategory } from '@llm-radar/types';

const LABELS: Record<ModelCategory, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  flash: 'Flash',
  multimodal: 'Multimodal',
};

export interface CategoryFilterProps {
  selected: Set<ModelCategory>;
  onToggle: (category: ModelCategory) => void;
  onClear: () => void;
}

export function CategoryFilter({ selected, onToggle, onClear }: CategoryFilterProps): JSX.Element {
  return (
    <div role="group" aria-label="Filter models by category" className="flex flex-wrap items-center gap-2">
      {CATEGORIES.map((cat) => {
        const active = selected.has(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            aria-pressed={active}
            className="rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            style={{
              backgroundColor: active ? '#22d3ee' : '#1f2937',
              color: active ? '#0b0f17' : '#f8fafc',
              border: '2px solid',
              borderColor: active ? '#22d3ee' : 'rgba(248,250,252,0.2)',
            }}
          >
            {LABELS[cat]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onClear}
        className="ml-2 rounded-full border border-ink/30 px-3 py-2 text-xs text-ink/70 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Clear
      </button>
    </div>
  );
}