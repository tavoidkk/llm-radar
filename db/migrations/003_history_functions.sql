-- 003_history_functions.sql
-- Ejecutar en Supabase SQL Editor tras 001 y 002

create or replace function public.get_model_history(
  p_model_id  text,
  p_from      timestamptz default now() - interval '7 days',
  p_to        timestamptz default now(),
  p_bucket    text        default 'hour'
)
returns table (
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
    date_trunc(p_bucket::text, "timestamp") as bucket,
    avg(elo_rating)::numeric(7,2)             as avg_elo,
    avg(tokens_per_sec)::numeric(10,2)        as avg_tps,
    avg(cost_input)::numeric(12,6)            as avg_cost_in,
    avg(cost_output)::numeric(12,6)           as avg_cost_out,
    count(*)::bigint                          as samples
  from public.metrics
  where model_id = p_model_id
    and "timestamp" between p_from and p_to
  group by 1
  order by 1;
$$;

create or replace function public.get_top_models(p_limit int default 50)
returns table (
  model_id       text,
  name           text,
  provider       text,
  category       text,
  elo_rating     numeric,
  tokens_per_sec numeric,
  cost_input     numeric,
  cost_output    numeric,
  ts             timestamptz
)
language sql
stable
as $$
  select
    model_id, model_name as name, provider, category,
    elo_rating, tokens_per_sec, cost_input, cost_output,
    "timestamp" as ts
  from public.v_latest_metrics
  order by elo_rating desc
  limit p_limit;
$$;

grant execute on function public.get_model_history(text, timestamptz, timestamptz, text) to anon, authenticated, service_role;
grant execute on function public.get_top_models(int)                                          to anon, authenticated, service_role;