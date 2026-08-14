export const PROVIDER_BRAND_COLOR: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97757',
  google: '#4285F4',
  meta: '#0668E1',
  mistral: '#FA520F',
  'mistral ai': '#FA520F',
  deepseek: '#4D6BFE',
  cohere: '#39594D',
  perplexity: '#20B8CD',
  xai: '#f8fafc',
  'x-ai': '#f8fafc',
  groq: '#F55036',
  nvidia: '#76B900',
  microsoft: '#00A4EF',
  amazon: '#FF9900',
  alibaba: '#FF6A00',
  qwen: '#FF6A00',
  ai21: '#FC6400',
  openrouter: '#8b8b8b',
  moonshot: '#4D6BFE',
  moonshotai: '#4D6BFE',
  zhipu: '#3B5AF2',
  '01.ai': '#5B8DEF',
  '01-ai': '#5B8DEF',
  minimax: '#7C3AED',
};

export const PROVIDER_SLUG: Record<string, string> = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  meta: 'meta',
  mistral: 'mistral',
  'mistral ai': 'mistral',
  deepseek: 'deepseek',
  cohere: 'cohere',
  perplexity: 'perplexity',
  xai: 'xai',
  'x-ai': 'xai',
  groq: 'groq',
  nvidia: 'nvidia',
  microsoft: 'microsoft',
  amazon: 'amazon',
  alibaba: 'alibaba',
  qwen: 'alibaba',
  ai21: 'ai21',
  openrouter: 'openrouter',
  moonshot: 'moonshot',
  moonshotai: 'moonshot',
  zhipu: 'zhipu',
  '01.ai': '01-ai',
  '01-ai': '01-ai',
  minimax: 'minimax',
};

export function normalizeProvider(provider: string): string {
  const stripped = provider.trim().replace(/^[^A-Za-z0-9]+/, '');
  return stripped.toLowerCase();
}

export function providerSlug(provider: string): string {
  const key = normalizeProvider(provider);
  return PROVIDER_SLUG[key] ?? key.replace(/[^a-z0-9]+/g, '-');
}

export function providerLogoPath(provider: string): string {
  return `/providers/${providerSlug(provider)}.svg`;
}
