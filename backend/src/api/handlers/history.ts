import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { getSupabase } from '../../config/supabase.js';
import { sendJson, sendError } from '../util/response.js';

const HistoryQuerySchema = z.object({
  modelId: z.string().min(1).max(200),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  bucket: z.enum(['hour', 'day']).default('hour'),
});

export async function handleHistory(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = HistoryQuerySchema.safeParse(params);
  if (!parsed.success) {
    sendError(res, 400, 'invalid_query', parsed.error.issues.map((i) => i.message).join('; '));
    return;
  }

  const { modelId, bucket } = parsed.data;
  const args: Record<string, unknown> = { p_model_id: modelId, p_bucket: bucket };
  if (parsed.data.from) args['p_from'] = parsed.data.from;
  if (parsed.data.to) args['p_to'] = parsed.data.to;

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_model_history', args as never);

  if (error) {
    sendError(res, 502, 'db_error', error.message);
    return;
  }

  const points = Array.isArray(data)
    ? (data as Array<Record<string, unknown>>).map((row) => ({
        bucket: String(row['bucket']),
        avgEloRating: Number(row['avg_elo'] ?? 0),
        avgTokensPerSec: Number(row['avg_tps'] ?? 0),
        avgCostInput: Number(row['avg_cost_in'] ?? 0),
        avgCostOutput: Number(row['avg_cost_out'] ?? 0),
        samples: Number(row['samples'] ?? 0),
      }))
    : [];

  sendJson(res, 200, { modelId, bucket, points });
}