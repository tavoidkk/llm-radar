export type ModelCategory = 'reasoning' | 'coding' | 'flash' | 'multimodal';
export type MetricSource  = 'openrouter' | 'artificial_analysis';

export interface AiModel {
  id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  contextWindow: number | null;
  homepageUrl: string | null;
  maxOutputTokens: number | null;
  inputModalities: string[];
  outputModalities: string[];
  modality: string | null;
}

export interface MetricPayload {
  modelId: string;
  eloRating: number;
  tokensPerSec: number;
  costInput: number;
  costOutput: number;
  latencyMs?: number;
  source: MetricSource;
  timestamp: string;
}

export type RadarEvent =
  | { type: 'snapshot'; emittedAt: string; payload: MetricPayload[] }
  | { type: 'tick';     emittedAt: string; payload: MetricPayload }
  | { type: 'history';  emittedAt: string; payload: HistoryPoint[] }
  | { type: 'error';    emittedAt: string; payload: { error: string } };

export interface HistoryPoint {
  bucket: string;
  avgEloRating: number;
  avgTokensPerSec: number;
  avgCostInput: number;
  avgCostOutput: number;
}

export interface HistoryQuery {
  modelId: string;
  from?: string;
  to?: string;
  bucket?: 'hour' | 'day';
}

export const CATEGORIES: readonly ModelCategory[] = [
  'reasoning',
  'coding',
  'flash',
  'multimodal',
] as const;