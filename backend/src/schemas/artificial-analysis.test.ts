import { describe, it, expect } from 'vitest';
import { ArtificialAnalysisModelSchema, ArtificialAnalysisResponseSchema } from './artificial-analysis.js';

describe('Artificial Analysis v2 Zod schemas', () => {
  it('parses a real AA model entry (from live API shape)', () => {
    const r = ArtificialAnalysisModelSchema.parse({
      id: '81972fba-1219-477e-bbfb-18c656a63ff7',
      name: 'GPT-5.6 Terra (high)',
      slug: 'gpt-5-6-terra-high',
      release_date: '2026-07-09',
      model_creator: { id: 'e67e56e3', name: 'OpenAI', slug: 'openai' },
      evaluations: {
        artificial_analysis_intelligence_index: 50.1,
        artificial_analysis_coding_index: 67.1,
        artificial_analysis_math_index: null,
        mmlu_pro: null,
        gpqa: 0.896,
      },
      pricing: {
        price_1m_blended_3_to_1: 4.5,
        price_1m_input_tokens: 2,
        price_1m_output_tokens: 12,
      },
      median_output_tokens_per_second: 78.367,
      median_time_to_first_token_seconds: 2.879,
      median_time_to_first_answer_token: 2.879,
    });
    expect(r.name).toBe('GPT-5.6 Terra (high)');
    expect(r.evaluations?.artificial_analysis_intelligence_index).toBe(50.1);
    expect(r.pricing?.price_1m_input_tokens).toBe(2);
  });

  it('accepts nullable evaluation indexes', () => {
    const r = ArtificialAnalysisModelSchema.parse({
      id: 'x',
      name: 'Y',
      slug: 'y',
      evaluations: {
        artificial_analysis_intelligence_index: null,
        artificial_analysis_coding_index: null,
      },
    });
    expect(r.evaluations?.artificial_analysis_intelligence_index).toBeNull();
    expect(r.evaluations?.artificial_analysis_coding_index).toBeNull();
  });

  it('accepts a model with only id+name (sparse entry)', () => {
    const r = ArtificialAnalysisModelSchema.parse({ id: 'a', name: 'Minimal' });
    expect(r.evaluations).toEqual({});
    expect(r.pricing).toEqual({});
  });

  it('rejects missing name', () => {
    expect(() => ArtificialAnalysisModelSchema.parse({ id: 'x' })).toThrow();
  });

  it('parses full response with top-level status', () => {
    const r = ArtificialAnalysisResponseSchema.parse({
      status: 200,
      prompt_options: { parallel_queries: 1, prompt_length: 1000 },
      data: [
        { id: 'a', name: 'A', slug: 'a', evaluations: { artificial_analysis_intelligence_index: 10 } },
        { id: 'b', name: 'B', slug: 'b' },
      ],
    });
    expect(r.data.length).toBe(2);
  });
});