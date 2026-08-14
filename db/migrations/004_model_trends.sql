-- 004_model_trends.sql
-- Ejecutar en Supabase SQL Editor tras 001-003

-- 1) Columnas de specs técnicas en models
alter table public.models
  add column if not exists max_output_tokens integer,
  add column if not exists input_modalities  text[] default '{}',
  add column if not exists output_modalities text[] default '{}',
  add column if not exists modality          text;

-- 2) v_latest_metrics: añade las columnas nuevas de models al FINAL
--    (create or replace view requiere que el orden de columnas existentes no cambie)
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
  md."timestamp",
  m.context_window,
  m.homepage_url,
  m.max_output_tokens,
  m.input_modalities,
  m.output_modalities,
  m.modality
from public.metrics md
join public.models  m on m.id = md.model_id
order by model_id, md."timestamp" desc;

-- 3) Trends batch para sparklines (1 request, N modelos)
create or replace function public.get_model_trends(
  p_model_ids text[],
  p_bucket    text default 'hour'
)
returns table (
  model_id      text,
  bucket        timestamptz,
  avg_elo       numeric,
  avg_tps       numeric,
  avg_cost_in   numeric,
  avg_cost_out  numeric,
  samples       bigint
)
language sql
stable
as $$
  select
    model_id,
    date_trunc(p_bucket::text, "timestamp") as bucket,
    avg(elo_rating)::numeric(7,2)             as avg_elo,
    avg(tokens_per_sec)::numeric(10,2)        as avg_tps,
    avg(cost_input)::numeric(12,6)            as avg_cost_in,
    avg(cost_output)::numeric(12,6)           as avg_cost_out,
    count(*)::bigint                          as samples
  from public.metrics
  where model_id = any(p_model_ids)
    and "timestamp" between now() - interval '7 days' and now()
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.get_model_trends(text[], text) to anon, authenticated, service_role;
