import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from '../types/supabase.js';

let cached: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (cached) return cached;

  cached = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: { headers: { 'x-client': 'llm-radar-backend' } },
  });

  return cached;
}