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
