import { describe, it, expect } from 'vitest';
import type { ArtificialAnalysisModel } from '../schemas/artificial-analysis.js';
import { buildCrossReferenceIndex, matchAaModel, CURATED_ALIASES } from './cross-reference.js';

function aa(slug: string, name = slug, intel = 10): ArtificialAnalysisModel {
  return {
    id: `id-${slug}`,
    name,
    slug,
    evaluations: { artificial_analysis_intelligence_index: intel },
    pricing: {},
  };
}

const AA_MODELS: ArtificialAnalysisModel[] = [
  aa('gpt-4o', 'GPT-4o', 11.1),
  aa('gpt-4o-mini', 'GPT-4o mini', 6.7),
  aa('claude-4-5-haiku', 'Claude 4.5 Haiku', 12),
  aa('claude-35-sonnet', 'Claude 3.5 Sonnet', 9.8),
  aa('gemini-3-7-flash', 'Gemini 3.7 Flash (high)', 20),
  aa('grok-4-6', 'Grok 4.6 (high)', 25),
  aa('llama-3-3-instruct-70b', 'Llama 3.3 Instruct 70B', 9.3),
  aa('deepseek-v4-pro', 'DeepSeek V4 Pro', 53.2),
  aa('deepseek-v4-flash', 'DeepSeek V4 Flash', 40),
  aa('nova-lite', 'Nova Lite', 5),
  aa('command-r-03-2024', 'Command-R (Mar 24)', 1.7),
  aa('command-r-plus-04-2024', 'Command-R+ (Apr 24)', 2.6),
  aa('qwen-2-5-turbo', 'Qwen2.5 Turbo', 4),
  aa('qwen3-8b-instruct-reasoning', 'Qwen3 8B (Reasoning)', 30),
  aa('gpt-5-6-luna', 'GPT-5.6 Luna (max)', 60),
  aa('claude-opus-5', 'Claude Opus 5', 63),
];

describe('cross-reference matcher', () => {
  const index = buildCrossReferenceIndex(AA_MODELS);

  it('matches by exact slug (punct-normalized)', () => {
    const hit = matchAaModel('x-ai/grok-4.6', index);
    expect(hit?.aa.slug).toBe('grok-4-6');
    expect(hit?.via).toBe('exact');
  });

  it('matches by token-set when token order differs', () => {
    const hit = matchAaModel('anthropic/claude-haiku-4.5', index);
    expect(hit?.aa.slug).toBe('claude-4-5-haiku');
    expect(hit?.via).toBe('tokens');
  });

  it('matches stripped variants (fast -> max effort family)', () => {
    const hit = matchAaModel('anthropic/claude-opus-5-fast', index);
    expect(hit?.aa.slug).toBe('claude-opus-5');
    expect(hit?.via).toBe('stripped');
  });

  it('matches dated deepseek via curated alias', () => {
    const hit = matchAaModel('deepseek/deepseek-v4-pro-0813', index);
    expect(hit?.aa.slug).toBe('deepseek-v4-pro');
    expect(hit?.via).toBe('alias');
  });

  it('matches date-suffixed cohere via curated alias (not wrong command-r)', () => {
    const hit = matchAaModel('cohere/command-r-08-2024', index);
    expect(hit?.aa.slug).toBe('command-r-03-2024');
  });

  it('does NOT collapse bare-family tokens (qwen-plus should not match qwen2.5-turbo)', () => {
    const hit = matchAaModel('qwen/qwen-plus', index);
    expect(hit).toBeNull();
  });

  it('prefers highest intelligence among effort variants', () => {
    const hit = matchAaModel('openai/gpt-5.6-luna-pro', index);
    expect(hit?.aa.slug).toBe('gpt-5-6-luna');
  });

  it('returns null for completely unrelated ids', () => {
    expect(matchAaModel('sakana/fugu-ultra', index)).toBeNull();
    expect(matchAaModel('openrouter/fusion', index)).toBeNull();
  });

  it('exposes curated aliases as a mapping', () => {
    expect(CURATED_ALIASES['deepseek/deepseek-v4-flash-0731']).toBe('deepseek-v4-flash');
  });
});