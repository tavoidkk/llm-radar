import { env } from '../config/env.js';
import { OpenRouterModelsResponseSchema, type OpenRouterModel } from '../schemas/openrouter.js';

const ENDPOINT = 'https://openrouter.ai/api/v1/models';
const TIMEOUT_MS = 10_000;

export class OpenRouterError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export async function fetchOpenRouterModels(signal?: AbortSignal): Promise<OpenRouterModel[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => ctrl.abort(), { once: true });

  try {
    const res = await fetch(ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        Accept: 'application/json',
        'User-Agent': 'llm-radar/0.1 (backend)',
      },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new OpenRouterError(`OpenRouter HTTP ${res.status}: ${res.statusText}`);
    }

    const json: unknown = await res.json();
    const parsed = OpenRouterModelsResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new OpenRouterError('OpenRouter payload validation failed', parsed.error);
    }
    return parsed.data.data;
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    throw new OpenRouterError('OpenRouter request failed', err);
  } finally {
    clearTimeout(timer);
  }
}

export function pricingToUsdPer1k(perTokenString: string): number {
  const perToken = Number(perTokenString);
  if (!Number.isFinite(perToken) || perToken < 0) return 0;
  return Number((perToken * 1000).toFixed(6));
}