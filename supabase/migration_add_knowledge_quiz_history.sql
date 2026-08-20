-- Knowledge quiz generation history (role + level quizzes).
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
