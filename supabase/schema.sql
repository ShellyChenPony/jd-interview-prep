-- Run this in Supabase SQL Editor once.

create extension if not exists "pgcrypto";

create table if not exists public.resume_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  name text not null default '',
  job_title text not null default '',
  source_filename text,
  source_text text not null default '',
  language text not null default 'en',
  resume_json jsonb not null,
  interview_markers_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- If you already created the table earlier, run these once as needed:
-- alter table public.resume_history add column if not exists language text not null default 'en';
-- alter table public.resume_history add column if not exists interview_markers_json jsonb not null default '[]'::jsonb;

create index if not exists resume_history_device_created_idx
  on public.resume_history (device_id, created_at desc);

alter table public.resume_history enable row level security;

-- App talks to Supabase via server API + service role key.
-- Keep RLS on; no direct anon policies needed for this MVP.
