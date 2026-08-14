import type { ArtificialAnalysisModel } from '../schemas/artificial-analysis.js';

const VARIANT_TOKENS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'nano', 'small', 'medium', 'large', 'xlarge', 'high', 'xhigh', 'low',
  'fast', 'thinking', 'reasoning', 'non', 'non-reasoning', 'preview', 'latest', 'official', 'adaptive',
  'effort', 'vision', 'audio', 'instruct', 'chat', 'free', 'batch', 'v1', 'v2', 'v3', 'v4', 'v5',
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '2024', '2025', '2026',
  'max-effort', 'turbo',
]);

export interface CrossReferenceIndex {
  byNormKey: Map<string, ArtificialAnalysisModel>;
  byTokenSet: Map<string, ArtificialAnalysisModel[]>;
  byStrippedKey: Map<string, ArtificialAnalysisModel[]>;
  all: ArtificialAnalysisModel[];
}

export interface CrossReferenceMatch {
  aa: ArtificialAnalysisModel;
  via: 'exact' | 'tokens' | 'stripped' | 'alias';
}

export const CURATED_ALIASES: Readonly<Record<string, string>> = {
  'deepseek/deepseek-v4-pro-0813': 'deepseek-v4-pro',
  'deepseek/deepseek-v4-flash-0731': 'deepseek-v4-flash',
  'openai/gpt-chat-latest': 'gpt-4o',
  'openai/gpt-4-turbo': 'gpt-4-turbo',
  'google/gemini-3.1-flash-image': 'gemini-3-1-flash',
  'google/gemini-3.1-flash-lite-image': 'gemini-3-1-flash-lite-preview',
  'x-ai/grok-build-0.1': 'grok-build',
  'openrouter/auto-beta': 'auto-beta',
  'openrouter/fusion': 'fusion',
  'cohere/command-r-08-2024': 'command-r-03-2024',
  'cohere/command-r-plus-08-2024': 'command-r-plus-04-2024',
};

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function tokenSet(s: string): string[] {
  const toks = s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  return [...new Set(toks)].sort();
}

function stripVariant(tokens: string[]): string[] {
  return tokens.filter((t) => !VARIANT_TOKENS.has(t));
}

function strippedKey(s: string): string {
  return stripVariant(tokenSet(s)).join(' ');
}

function bestByIntelligence(candidates: readonly ArtificialAnalysisModel[]): ArtificialAnalysisModel {
  const sorted = candidates.slice().sort(
    (a, b) =>
      (b.evaluations?.artificial_analysis_intelligence_index ?? 0) -
      (a.evaluations?.artificial_analysis_intelligence_index ?? 0),
  );
  return sorted[0] ?? candidates[0]!;
}

export function buildCrossReferenceIndex(aaModels: readonly ArtificialAnalysisModel[]): CrossReferenceIndex {
  const byNormKey = new Map<string, ArtificialAnalysisModel>();
  const byTokenSet = new Map<string, ArtificialAnalysisModel[]>();
  const byStrippedKey = new Map<string, ArtificialAnalysisModel[]>();

  for (const m of aaModels) {
    const slug = m.slug ?? m.name;
    byNormKey.set(normKey(slug), m);

    const tk = tokenSet(slug).join(' ');
    if (!byTokenSet.has(tk)) byTokenSet.set(tk, []);
    byTokenSet.get(tk)!.push(m);

    const sk = strippedKey(slug);
    if (!byStrippedKey.has(sk)) byStrippedKey.set(sk, []);
    byStrippedKey.get(sk)!.push(m);
  }

  return { byNormKey, byTokenSet, byStrippedKey, all: [...aaModels] };
}

function containsAllSuperset(orTokens: string[], candidateTokens: string[]): boolean {
  const nonVariantOr = stripVariant(orTokens);
  const nonVariantCandidate = stripVariant(candidateTokens);
  for (const t of nonVariantOr) {
    if (!nonVariantCandidate.includes(t)) return false;
  }
  return true;
}

function matchesEffort(orTokens: string[], candidateTokens: string[]): boolean {
  const variants = new Set([
    'fast', 'thinking', 'reasoning', 'preview', 'xhigh', 'high', 'medium', 'low', 'max',
    'instruct', 'chat', 'adaptive', 'max-effort',
  ]);
  const orV = orTokens.filter((t) => variants.has(t));
  const candV = candidateTokens.filter((t) => variants.has(t));
  if (orV.length === 0 || candV.length === 0) return true;
  return orV.some((t) => candV.includes(t)) || candV.some((t) => orV.includes(t));
}

export function matchAaModel(orId: string, index: CrossReferenceIndex): CrossReferenceMatch | null {
  const aliasSlug = CURATED_ALIASES[orId];
  if (aliasSlug) {
    const entry = index.byNormKey.get(normKey(aliasSlug));
    if (entry) return { aa: entry, via: 'alias' };
  }

  const suffix = orId.slice(orId.indexOf('/') + 1);

  const exact = index.byNormKey.get(normKey(suffix));
  if (exact) return { aa: exact, via: 'exact' };

  const tk = tokenSet(suffix).join(' ');
  const tokenCands = index.byTokenSet.get(tk);
  if (tokenCands && tokenCands.length > 0) {
    return { aa: bestByIntelligence(tokenCands), via: 'tokens' };
  }

  const sk = strippedKey(suffix);
  const strippedCands = index.byStrippedKey.get(sk);
  if (strippedCands && strippedCands.length > 0) {
    const orTokens = tokenSet(suffix);
    const identity = stripVariant(orTokens);
    const compatible = strippedCands.filter((c) => {
      const cTokens = tokenSet(c.slug ?? c.name);
      return containsAllSuperset(orTokens, cTokens) && matchesEffort(orTokens, cTokens) && identity.length >= 2;
    });
    if (compatible.length === 1) {
      return { aa: compatible[0]!, via: 'stripped' };
    }
    if (compatible.length > 1) {
      return { aa: bestByIntelligence(compatible), via: 'stripped' };
    }
  }

  return null;
}