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

-- Practice: JD-based LeetCode recommendations.
create table if not exists public.practice_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  jd_text text not null default '',
  jd_title text not null default '',
  recommend_json jsonb not null default '{}'::jsonb,
  env text not null default 'dev' check (env in ('dev', 'prod')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists practice_history_device_env_active_idx
  on public.practice_history (device_id, env, updated_at desc)
  where deleted_at is null;

alter table public.practice_history enable row level security;

-- Knowledge quiz generation history.
create table if not exists public.knowledge_quiz_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  category_id text not null default '',
  quiz_level text not null default 'mid',
  role_title text not null default '',
  language text not null default 'en',
  quiz_json jsonb not null default '{}'::jsonb,
  answers_json jsonb not null default '{}'::jsonb,
  score int,
  question_count int not null default 0,
  env text not null default 'dev' check (env in ('dev', 'prod')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists knowledge_quiz_history_device_env_active_idx
  on public.knowledge_quiz_history (device_id, env, updated_at desc)
  where deleted_at is null;

create index if not exists knowledge_quiz_history_user_env_active_idx
  on public.knowledge_quiz_history (user_id, env, updated_at desc)
  where deleted_at is null and user_id is not null;

alter table public.knowledge_quiz_history enable row level security;

-- Daily AI usage for anonymous promo quotas (device + IP).
create table if not exists public.ai_usage_daily (
  day date not null,
  env text not null default 'dev' check (env in ('dev', 'prod')),
  feature text not null,
  subject_type text not null check (subject_type in ('device', 'ip')),
  subject_key text not null,
  count int not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, env, feature, subject_type, subject_key)
);

create index if not exists ai_usage_daily_updated_idx
  on public.ai_usage_daily (updated_at desc);

alter table public.ai_usage_daily enable row level security;

create or replace function public.increment_ai_usage(
  p_day date,
  p_env text,
  p_feature text,
  p_subject_type text,
  p_subject_key text
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.ai_usage_daily as u (day, env, feature, subject_type, subject_key, count, updated_at)
  values (p_day, p_env, p_feature, p_subject_type, p_subject_key, 1, now())
  on conflict (day, env, feature, subject_type, subject_key)
  do update set
    count = u.count + 1,
    updated_at = now()
  returning u.count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_ai_usage(date, text, text, text, text) from public;
grant execute on function public.increment_ai_usage(date, text, text, text, text) to service_role;

-- Google Auth profiles (synced from auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

alter table public.resume_history
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.interview_prep_history
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.practice_history
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists resume_history_user_env_active_idx
  on public.resume_history (user_id, env, created_at desc)
  where deleted_at is null and user_id is not null;

create index if not exists interview_prep_history_user_env_active_idx
  on public.interview_prep_history (user_id, env, updated_at desc)
  where deleted_at is null and user_id is not null;

create index if not exists practice_history_user_env_active_idx
  on public.practice_history (user_id, env, updated_at desc)
  where deleted_at is null and user_id is not null;
-- Anonymous product feedback from the floating widget.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  env text not null default 'dev' check (env in ('dev', 'prod')),
  category text not null default 'general'
    check (category in ('general', 'bug', 'idea', 'other')),
  message text not null,
  contact_email text,
  page_path text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_env_created_idx
  on public.feedback (env, created_at desc);

create index if not exists feedback_device_created_idx
  on public.feedback (device_id, created_at desc);

alter table public.feedback enable row level security;

-- App talks to Supabase via server API + service role key.
-- Keep RLS on; no direct anon policies needed for this MVP.
