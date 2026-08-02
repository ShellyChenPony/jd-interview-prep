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
  env text not null default 'dev' check (env in ('dev', 'prod')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- If you already created the table earlier, run these once as needed:
-- alter table public.resume_history add column if not exists language text not null default 'en';
-- alter table public.resume_history add column if not exists interview_markers_json jsonb not null default '[]'::jsonb;
-- alter table public.resume_history add column if not exists deleted_at timestamptz;
-- alter table public.resume_history add column if not exists env text not null default 'dev';

create index if not exists resume_history_device_created_idx
  on public.resume_history (device_id, created_at desc);

create index if not exists resume_history_device_active_idx
  on public.resume_history (device_id, created_at desc)
  where deleted_at is null;

create index if not exists resume_history_device_env_active_idx
  on public.resume_history (device_id, env, created_at desc)
  where deleted_at is null;

alter table public.resume_history enable row level security;

-- Interview Prep: pasted JD + generated questions + JD×Resume match analysis.
create table if not exists public.interview_prep_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  jd_text text not null default '',
  jd_title text not null default '',
  job_summary text not null default '',
  questions_json jsonb not null default '[]'::jsonb,
  match_json jsonb,
  cover_letter_json jsonb,
  resume_history_id uuid references public.resume_history (id) on delete set null,
  resume_label text not null default '',
  env text not null default 'dev' check (env in ('dev', 'prod')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists interview_prep_history_device_updated_idx
  on public.interview_prep_history (device_id, updated_at desc);

create index if not exists interview_prep_history_device_active_idx
  on public.interview_prep_history (device_id, updated_at desc)
  where deleted_at is null;

create index if not exists interview_prep_history_device_env_active_idx
  on public.interview_prep_history (device_id, env, updated_at desc)
  where deleted_at is null;

alter table public.interview_prep_history enable row level security;

-- App talks to Supabase via server API + service role key.
-- Keep RLS on; no direct anon policies needed for this MVP.
