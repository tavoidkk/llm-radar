import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { getSupabase } from '../../config/supabase.js';
import { sendJson, sendError } from '../util/response.js';

const TrendsQuerySchema = z.object({
  modelIds: z.string().min(1).max(4000),
  bucket: z.enum(['hour', 'day']).default('hour'),
});

interface TrendRow {
  model_id: string;
  bucket: string;
  avg_elo: number;
  avg_tps: number;
  avg_cost_in: number;
  avg_cost_out: number;
  samples: number;
}

export async function handleTrends(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = TrendsQuerySchema.safeParse(params);
  if (!parsed.success) {
    sendError(res, 400, 'invalid_query', parsed.error.issues.map((i) => i.message).join('; '));
    return;
  }

  const modelIds = parsed.data.modelIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (modelIds.length === 0 || modelIds.length > 100) {
    sendError(res, 400, 'invalid_query', 'modelIds must contain between 1 and 100 model ids');
    return;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_model_trends', {
    p_model_ids: modelIds,
    p_bucket: parsed.data.bucket,
  } as never);

  if (error) {
    sendError(res, 502, 'db_error', error.message);
    return;
  }

  const trends: Record<string, TrendRow[]> = {};
  for (const row of Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []) {
    const modelId = String(row['model_id'] ?? '');
    if (!modelId) continue;
    const point: TrendRow = {
      model_id: modelId,
      bucket: String(row['bucket']),
      avg_elo: Number(row['avg_elo'] ?? 0),
      avg_tps: Number(row['avg_tps'] ?? 0),
      avg_cost_in: Number(row['avg_cost_in'] ?? 0),
      avg_cost_out: Number(row['avg_cost_out'] ?? 0),
      samples: Number(row['samples'] ?? 0),
    };
    if (!trends[modelId]) trends[modelId] = [];
    trends[modelId]!.push(point);
  }

  sendJson(res, 200, { bucket: parsed.data.bucket, trends });
}
