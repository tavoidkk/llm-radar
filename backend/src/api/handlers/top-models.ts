import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { getSupabase } from '../../config/supabase.js';
import { sendJson, sendError } from '../util/response.js';
import type { Database } from '../../types/supabase.js';

type LatestRow = Database['public']['Views']['v_latest_metrics']['Row'];

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).default(50),
  category: z.enum(['reasoning', 'coding', 'flash', 'multimodal']).optional(),
});

function toDto(row: LatestRow) {
  return {
    model_id: row.model_id,
    name: row.model_name,
    provider: row.provider,
    category: row.category,
    elo_rating: row.elo_rating,
    tokens_per_sec: row.tokens_per_sec,
    cost_input: row.cost_input,
    cost_output: row.cost_output,
    ts: row.timestamp,
    context_window: row.context_window,
    homepage_url: row.homepage_url,
    max_output_tokens: row.max_output_tokens,
    input_modalities: row.input_modalities,
    output_modalities: row.output_modalities,
    modality: row.modality,
  };
}

export async function handleTopModels(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    sendError(res, 400, 'invalid_query', parsed.error.issues.map((i) => i.message).join('; '));
    return;
  }

  const supabase = getSupabase();
  let q = supabase.from('v_latest_metrics').select('*').order('elo_rating', { ascending: false }).limit(parsed.data.limit);
  if (parsed.data.category) {
    q = q.eq('category', parsed.data.category);
  }

  const { data, error } = await q;
  if (error) {
    sendError(res, 502, 'db_error', error.message);
    return;
  }

  sendJson(res, 200, {
    limit: parsed.data.limit,
    category: parsed.data.category ?? null,
    models: (data ?? []).map(toDto),
  });
}

export async function handleModels(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('models').select('id, name, provider, category, context_window, homepage_url').order('name');
  if (error) {
    sendError(res, 502, 'db_error', error.message);
    return;
  }
  sendJson(res, 200, { models: data ?? [] });
}