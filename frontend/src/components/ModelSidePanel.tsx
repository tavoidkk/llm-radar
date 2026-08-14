'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AiModel, MetricPayload } from '@llm-radar/types';
import { HistoryPanel } from './HistoryPanel';
import { ModalityBadge } from './ModalityBadge';
import { ProviderLogo } from './ProviderLogo';
import { formatUsdPer1M, formatTokens } from '@/lib/format';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Brain,
  ExternalLink,
  Gauge,
  Hash,
  Info,
  Lightbulb,
  Tag,
  Type,
  Workflow,
  X,
} from '@/components/Icons';

export interface ModelSidePanelProps {
  model: AiModel;
  metric: MetricPayload;
  onClose: () => void;
}

export function ModelSidePanel({ model, metric, onClose }: ModelSidePanelProps): JSX.Element {
  const [historyOpen, setHistoryOpen] = useState(false);
  const isReasoning = model.category === 'reasoning';

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-ink/20 bg-surface p-6 shadow-2xl"
        role="complementary"
        aria-label={`Details for ${model.name}`}
      >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ProviderLogo provider={model.provider} name={model.name} size={28} />
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/60">{model.provider}</p>
            <h3 className="text-xl font-semibold leading-tight">{model.name}</h3>
            <p className="mt-1 text-sm text-ink/60">{model.id}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close model details"
          className="rounded-md border border-ink/30 p-1.5 text-ink/70 hover:bg-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        <Row icon={Tag} label="Category">
          <span className="capitalize">{model.category}</span>
        </Row>

        <Row icon={Brain} label="Intelligence" info="Artificial Analysis intelligence index (0–100)">
          <span className="font-semibold">{metric.eloRating.toFixed(1)}</span>
        </Row>

        <Row icon={Gauge} label="Tokens/sec">
          {metric.tokensPerSec.toFixed(0)}
        </Row>

        <Row icon={ArrowDownToLine} label="Cost in">
          {`${formatUsdPer1M(metric.costInput)}/1M`}
        </Row>

        <Row icon={ArrowUpFromLine} label="Cost out">
          {`${formatUsdPer1M(metric.costOutput)}/1M`}
        </Row>

        <Row icon={BookOpen} label="Context Window" info="Context window size in tokens">
          {model.contextWindow ? formatTokens(model.contextWindow) : '—'}
        </Row>

        <Row icon={Hash} label="Max output" info="Maximum completion tokens">
          {model.maxOutputTokens ? formatTokens(model.maxOutputTokens) : '—'}
        </Row>

        <Row icon={Lightbulb} label="Reasoning" info="Whether the model is classified as a reasoning model">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isReasoning ? 'bg-emerald-900/50 text-emerald-300' : 'bg-ink/10 text-ink/50'
            }`}
          >
            {isReasoning ? 'Yes' : 'No'}
          </span>
        </Row>

        <Row icon={Type} label="Input modalities" info="Modalities the model can consume">
          {model.inputModalities.length > 0 ? (
            <span className="flex flex-wrap justify-end gap-1">
              {model.inputModalities.map((kind) => <ModalityBadge key={kind} kind={kind} />)}
            </span>
          ) : '—'}
        </Row>

        <Row icon={Type} label="Output modalities" info="Modalities the model can produce">
          {model.outputModalities.length > 0 ? (
            <span className="flex flex-wrap justify-end gap-1">
              {model.outputModalities.map((kind) => <ModalityBadge key={kind} kind={kind} />)}
            </span>
          ) : '—'}
        </Row>

        <Row icon={Workflow} label="Modality" info="Architecture modality signature">
          {model.modality ?? '—'}
        </Row>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={`https://openrouter.ai/models/${model.id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-bg hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Open on OpenRouter
          <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
        </a>
        {model.homepageUrl && (
          <a
            href={model.homepageUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink/30 px-3 py-2 hover:bg-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            View on company site
            <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
          </a>
        )}
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-pressed={historyOpen}
          className="rounded-md border border-ink/30 px-3 py-2 hover:bg-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {historyOpen ? 'Hide history' : 'Show history'}
        </button>
      </div>

      {historyOpen && (
        <section aria-label="Historical metrics" className="rounded-md border border-ink/20 bg-bg p-3">
          <HistoryPanel modelId={model.id} modelName={model.name} />
        </section>
      )}
      </aside>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  info,
  children,
}: {
  icon: LucideIcon;
  label: string;
  info?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="inline-flex items-center gap-2 text-sm text-ink/60">
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
        {children}
        {info && (
          <span className="text-ink/40" title={info}>
            <Info size={13} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </span>
    </div>
  );
}