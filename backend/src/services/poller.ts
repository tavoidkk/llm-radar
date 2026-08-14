import type { AiModel, MetricPayload, ModelCategory } from '@llm-radar/types';
import { env } from '../config/env.js';
import { fetchOpenRouterModels, pricingToUsdPer1k } from './openrouter.js';
import { fetchArtificialAnalysisModels } from './artificial-analysis.js';
import { cache } from './cache.js';
import { inferCategory, inferCategoryFromName, inferProvider } from './categorizer.js';
import { getSupabase } from '../config/supabase.js';
import { batcher } from './batcher.js';
import { incPollFailure, incPollSuccess, setCacheSize, setAaModels, setAaMatched, setAaLastOkAt, setAaFailures } from '../observability/metrics.js';
import { buildCrossReferenceIndex, matchAaModel } from './cross-reference.js';
import { aaHealth, recordAaSuccess, recordAaFailure } from './aa-health.js';

export interface PollerHandle {
  start(): void;
  stop(): void;
  pollOnce(): Promise<{ models: AiModel[]; metrics: MetricPayload[] }>;
}

export function createPoller(): PollerHandle {
  let timer: NodeJS.Timeout | undefined;
  let running = false;

  async function pollOnce(): Promise<{ models: AiModel[]; metrics: MetricPayload[] }> {
    const started = Date.now();

    const [orResult, aaResult] = await Promise.allSettled([
      fetchOpenRouterModels(),
      fetchArtificialAnalysisModels(),
    ]);

    if (orResult.status === 'rejected') {
      incPollFailure('openrouter_unreachable');
      console.warn('[poller] OpenRouter unreachable, serving from cache:', (orResult.reason as Error).message);
      return { models: [], metrics: cache.snapshot() };
    }

    if (aaResult.status === 'rejected') {
      incPollFailure('aa_unreachable');
      recordAaFailure((aaResult.reason as Error).message);
      setAaFailures(aaHealth.consecutiveFailures);
      console.warn('[poller] AA unavailable, no metrics will be written:', (aaResult.reason as Error).message);
      return { models: [], metrics: [] };
    }

    const aaModels = aaResult.value;
    const index = buildCrossReferenceIndex(aaModels);
    const openrouterModels = orResult.value;
    const models: AiModel[] = [];
    const metrics: MetricPayload[] = [];

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const m of openrouterModels) {
      const match = matchAaModel(m.id, index);
      if (!match) {
        unmatchedCount++;
        continue;
      }

      const aa = match.aa;
      const category: ModelCategory =
        inferCategoryFromName(aa.name) ??
        inferCategoryFromName(m.name) ??
        inferCategory(m.architecture?.modality) ??
        'reasoning';

      const model: AiModel = {
        id: m.id,
        name: m.name,
        provider: m.top_provider?.name ?? inferProvider(m.id),
        category,
        contextWindow: m.context_length ?? m.top_provider?.context_length ?? null,
        homepageUrl: m.homepage_url ?? null,
        maxOutputTokens: m.top_provider?.max_completion_tokens ?? null,
        inputModalities: m.architecture?.input_modalities ?? [],
        outputModalities: m.architecture?.output_modalities ?? [],
        modality: m.architecture?.modality ?? null,
      };
      models.push(model);

      const metric: MetricPayload = {
        modelId: m.id,
        eloRating: aa.evaluations?.artificial_analysis_intelligence_index ?? 0,
        tokensPerSec: aa.median_output_tokens_per_second ?? 0,
        costInput: pricingToUsdPer1k(m.pricing.prompt),
        costOutput: pricingToUsdPer1k(m.pricing.completion),
        ...(aa.median_time_to_first_token_seconds !== undefined
          ? { latencyMs: Math.round(aa.median_time_to_first_token_seconds * 1000) }
          : {}),
        source: 'artificial_analysis',
        timestamp: new Date().toISOString(),
      };
      metrics.push(metric);
      matchedCount++;
    }

    cache.set(metrics);
    setCacheSize(cache.size());
    setAaModels(aaModels.length);
    setAaMatched(matchedCount);
    setAaLastOkAt(Date.now());
    setAaFailures(0);
    recordAaSuccess(aaModels.length, matchedCount, unmatchedCount);
    void cache.flushNow();
    await upsertModels(models);
    await purgeLegacyMetrics();
    batcher.enqueue(metrics);
    incPollSuccess();

    const elapsed = Date.now() - started;
    console.log(
      `[poller] or=${openrouterModels.length} aa=${aaModels.length} matched=${matchedCount} unmatched=${unmatchedCount} cached=${cache.size()} elapsed=${elapsed}ms`,
    );
    return { models, metrics };
  }

  async function upsertModels(models: readonly AiModel[]): Promise<void> {
    if (models.length === 0) return;
    const supabase = getSupabase();
    const rows = models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      category: m.category,
      context_window: m.contextWindow,
      homepage_url: m.homepageUrl,
      max_output_tokens: m.maxOutputTokens,
      input_modalities: m.inputModalities,
      output_modalities: m.outputModalities,
      modality: m.modality,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('models')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
      console.warn('[poller] models upsert failed:', error.message);
    }
  }

  async function purgeLegacyMetrics(): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('metrics')
      .delete()
      .neq('source', 'artificial_analysis');
    if (error) {
      console.warn('[poller] legacy metrics purge failed:', error.message);
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    void tick();
    timer = setInterval(() => {
      void tick();
    }, env.POLL_INTERVAL_MS);
  }

  async function tick(): Promise<void> {
    try {
      await pollOnce();
    } catch (err) {
      incPollFailure('unhandled');
      console.error('[poller] tick failed:', (err as Error).message);
    }
  }

  function stop(): void {
    if (timer) clearInterval(timer);
    timer = undefined;
    running = false;
  }

  return { start, stop, pollOnce };
}
