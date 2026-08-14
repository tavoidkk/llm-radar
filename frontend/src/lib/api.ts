import type { MetricPayload, ModelCategory } from '@llm-radar/types';
import { getHttpBase } from '@/lib/backend-url';

const HTTP_BASE = getHttpBase();

export interface TopModelRow {
  model_id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  elo_rating: number;
  tokens_per_sec: number;
  cost_input: number;
  cost_output: number;
  ts: string;
  context_window: number | null;
  homepage_url: string | null;
  max_output_tokens: number | null;
  input_modalities: string[];
  output_modalities: string[];
  modality: string | null;
}

export interface HistoryPointDTO {
  bucket: string;
  avgEloRating: number;
  avgTokensPerSec: number;
  avgCostInput: number;
  avgCostOutput: number;
  samples: number;
}

export async function fetchTopModels(params: { limit?: number; category?: ModelCategory } = {}): Promise<TopModelRow[]> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.category) qs.set('category', params.category);
  const url = `${HTTP_BASE}/api/ai-models/top?${qs.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`top models failed: ${res.status}`);
  const json = (await res.json()) as { models: TopModelRow[] };
  return json.models;
}

export async function fetchHistory(modelId: string, bucket: 'hour' | 'day' = 'hour'): Promise<HistoryPointDTO[]> {
  const url = `${HTTP_BASE}/api/ai-models/history?modelId=${encodeURIComponent(modelId)}&bucket=${bucket}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  const json = (await res.json()) as { points: HistoryPointDTO[] };
  return json.points;
}

export async function fetchTrends(modelIds: string[], bucket: 'hour' | 'day' = 'hour'): Promise<Record<string, HistoryPointDTO[]>> {
  if (modelIds.length === 0) return {};
  const qs = new URLSearchParams();
  qs.set('modelIds', modelIds.join(','));
  qs.set('bucket', bucket);
  const url = `${HTTP_BASE}/api/ai-models/trends?${qs.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`trends failed: ${res.status}`);
  const json = (await res.json()) as { trends: Record<string, HistoryPointDTO[]> };
  return json.trends;
}

export function metricFromTopRow(row: TopModelRow): MetricPayload {
  return {
    modelId: row.model_id,
    eloRating: Number(row.elo_rating),
    tokensPerSec: Number(row.tokens_per_sec),
    costInput: Number(row.cost_input),
    costOutput: Number(row.cost_output),
    source: 'openrouter',
    timestamp: row.ts,
  };
}

export interface HealthDTO {
  status: 'ok' | 'degraded';
  uptime: number;
  aa: {
    ok: boolean;
    lastFetchAt: string | null;
    aaModels: number;
    matched: number;
    unmatched: number;
    consecutiveFailures: number;
    lastError: string | null;
  };
}

export async function fetchHealth(): Promise<HealthDTO> {
  const url = `${HTTP_BASE}/healthz`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`healthz failed: ${res.status}`);
  return (await res.json()) as HealthDTO;
}