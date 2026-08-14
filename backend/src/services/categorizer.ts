import type { ModelCategory } from '@llm-radar/types';

const MODALITY_TO_CATEGORY: Record<string, ModelCategory> = {
  'text->text': 'reasoning',
  'text+image->text': 'multimodal',
  'text+image+audio->text': 'multimodal',
  'image->text': 'multimodal',
  'text->image': 'multimodal',
  'audio->text': 'multimodal',
};

export function inferCategory(modality: string | undefined, fallback: ModelCategory = 'reasoning'): ModelCategory {
  if (!modality) return fallback;
  return MODALITY_TO_CATEGORY[modality] ?? fallback;
}

export function inferCategoryFromName(name: string): ModelCategory | undefined {
  const n = name.toLowerCase();
  if (/(coder|code-|starcoder|codestral|deepseek-coder)/.test(n)) return 'coding';
  if (/(flash|\bmini\b|\bhaiku\b|\bnano\b|llama-3-8b|mistral-7b|gemma-2-9b)/.test(n)) return 'flash';
  if (/(vision|llava|pixtral|grok-vision)/.test(n)) return 'multimodal';
  if (/(gpt-4o|claude|sonnet|opus|gemini)/.test(n)) return 'multimodal';
  return undefined;
}

export function inferProvider(modelId: string): string {
  const head = modelId.split('/')[0]?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    meta: 'Meta',
    'meta-llama': 'Meta',
    mistralai: 'Mistral',
    mistral: 'Mistral',
    deepseek: 'DeepSeek',
    cohere: 'Cohere',
    perplexity: 'Perplexity',
    qwen: 'Alibaba',
    xai: 'xAI',
    groq: 'Groq',
    nvidia: 'NVIDIA',
  };
  return map[head] ?? (head.charAt(0).toUpperCase() + head.slice(1));
}