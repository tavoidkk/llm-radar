-- 001_create_models.sql
-- Ejecutar en Supabase SQL Editor (esquema public)

create extension if not exists "pgcrypto";

create table if not exists public.models (
  id             text primary key,
  name           text not null,
  provider       text not null,
  category       text not null
                   check (category in ('reasoning','coding','flash','multimodal')),
  context_window integer,
  homepage_url   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_models_category on public.models (category);

alter table public.models enable row level security;
drop policy if exists "models_read_all" on public.models;
create policy "models_read_all" on public.models
  for select using (true);