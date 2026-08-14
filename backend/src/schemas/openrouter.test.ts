import { describe, it, expect } from 'vitest';
import { OpenRouterPricingSchema, OpenRouterModelSchema, OpenRouterModelsResponseSchema } from './openrouter.js';
import { pricingToUsdPer1k } from '../services/openrouter.js';

describe('OpenRouter Zod schemas', () => {
  it('parses pricing strings into numeric forms', () => {
    const p = OpenRouterPricingSchema.parse({ prompt: '0.000005', completion: '0.000015' });
    expect(p.prompt).toBe('0.000005');
  });

  it('rejects invalid pricing strings', () => {
    expect(() => OpenRouterPricingSchema.parse({ prompt: 'abc', completion: '0.0001' })).toThrow();
  });

  it('parses a complete model', () => {
    const m = OpenRouterModelSchema.parse({
      id: 'openai/gpt-4o',
      name: 'OpenAI: GPT-4o',
      context_length: 128000,
      pricing: { prompt: '0.000005', completion: '0.000015' },
      top_provider: { name: 'OpenAI', context_length: 128000 },
      architecture: { modality: 'text+image->text' },
    });
    expect(m.id).toBe('openai/gpt-4o');
  });

  it('rejects model without id', () => {
    expect(() =>
      OpenRouterModelSchema.parse({ name: 'X', pricing: { prompt: '0', completion: '0' } }),
    ).toThrow();
  });

  it('parses full list response', () => {
    const r = OpenRouterModelsResponseSchema.parse({
      data: [
        {
          id: 'a/b',
          name: 'A: B',
          pricing: { prompt: '0.000001', completion: '0.000002' },
        },
      ],
    });
    expect(r.data.length).toBe(1);
  });
});

describe('pricingToUsdPer1k', () => {
  it('converts per-token price to USD per 1k tokens', () => {
    expect(pricingToUsdPer1k('0.000005')).toBe(0.005);
    expect(pricingToUsdPer1k('0')).toBe(0);
  });

  it('clamps negative prices to 0 (OpenRouter uses -1 for unavailable)', () => {
    expect(pricingToUsdPer1k('-1')).toBe(0);
    expect(pricingToUsdPer1k('-0.5')).toBe(0);
  });

  it('returns 0 for non-numeric or invalid input', () => {
    expect(pricingToUsdPer1k('abc')).toBe(0);
    expect(pricingToUsdPer1k('')).toBe(0);
  });
});