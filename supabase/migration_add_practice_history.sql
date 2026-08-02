-- JD-based LeetCode practice recommendation history.
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
