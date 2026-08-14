import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PROJECT_ID: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  OPENROUTER_API_KEY: z.string().min(10),
  ARTIFICIAL_ANALYSIS_API_KEY: z.string().min(10),
  PORT: z.coerce.number().int().positive().default(8080),
  WS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
  BATCH_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  METRICS_CACHE_PATH: z.string().optional(),
});

export type Env = z.infer<typeof Env>;

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: Env = parsed.data;

export function allowedOrigins(): string[] {
  return env.WS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}