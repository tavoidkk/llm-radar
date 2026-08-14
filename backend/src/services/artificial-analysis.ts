import { env } from '../config/env.js';
import { ArtificialAnalysisResponseSchema, type ArtificialAnalysisModel } from '../schemas/artificial-analysis.js';

export const ARTIFICIAL_ANALYSIS_ENDPOINT = 'https://artificialanalysis.ai/api/v2/data/llms/models';
const TIMEOUT_MS = 15_000;

export class ArtificialAnalysisError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ArtificialAnalysisError';
  }
}

export function isArtificialAnalysisConfigured(): boolean {
  return Boolean(env.ARTIFICIAL_ANALYSIS_API_KEY);
}

export async function fetchArtificialAnalysisModels(signal?: AbortSignal): Promise<ArtificialAnalysisModel[]> {
  if (!isArtificialAnalysisConfigured()) {
    throw new ArtificialAnalysisError('ARTIFICIAL_ANALYSIS_API_KEY not configured');
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => ctrl.abort(), { once: true });

  try {
    const res = await fetch(ARTIFICIAL_ANALYSIS_ENDPOINT, {
      method: 'GET',
      headers: {
        'x-api-key': env.ARTIFICIAL_ANALYSIS_API_KEY,
        Accept: 'application/json',
        'User-Agent': 'llm-radar/0.1 (backend)',
      },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new ArtificialAnalysisError(`AA HTTP ${res.status}: ${res.statusText}`);
    }

    const json: unknown = await res.json();
    const parsed = ArtificialAnalysisResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new ArtificialAnalysisError('AA payload validation failed', parsed.error);
    }
    return parsed.data.data;
  } catch (err) {
    if (err instanceof ArtificialAnalysisError) throw err;
    throw new ArtificialAnalysisError('AA request failed', err);
  } finally {
    clearTimeout(timer);
  }
}