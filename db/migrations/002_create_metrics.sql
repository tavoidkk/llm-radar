-- 002_create_metrics.sql
-- Ejecutar en Supabase SQL Editor (esquema public)

create table if not exists public.metrics (
  id              bigserial primary key,
  model_id        text not null references public.models(id) on delete cascade,
  elo_rating      numeric(7,2)  not null,
  tokens_per_sec  numeric(10,2) not null,
  cost_input      numeric(12,6) not null,
  cost_output     numeric(12,6) not null,
  latency_ms      integer,
  source          text not null
                    check (source in ('openrouter','artificial_analysis')),
  "timestamp"     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint metrics_elo_range   check (elo_rating between 0 and 3000),
  constraint metrics_cost_nonneg check (cost_input >= 0 and cost_output >= 0)
);

create index if not exists idx_metrics_model_time_desc
  on public.metrics (model_id, "timestamp" desc);

create index if not exists idx_metrics_time_desc
  on public.metrics ("timestamp" desc);

create index if not exists idx_metrics_elo_desc
  on public.metrics (elo_rating desc);

create or replace view public.v_latest_metrics as
select distinct on (model_id)
  m.id            as model_id,
  m.name          as model_name,
  m.provider,
  m.category,
  md.elo_rating,
  md.tokens_per_sec,
  md.cost_input,
  md.cost_output,
  md.latency_ms,
  md.source,
  md."timestamp"
from public.metrics md
join public.models  m on m.id = md.model_id
order by model_id, md."timestamp" desc;

alter table public.metrics enable row level security;
drop policy if exists "metrics_read_all" on public.metrics;
create policy "metrics_read_all" on public.metrics
  for select using (true);