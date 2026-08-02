-- Isolate history rows by runtime environment (dev | prod).
-- Existing rows are backfilled as 'dev' (typical for early local usage).
-- On Vercel Production, new writes use 'prod' via getAppEnv().

alter table public.resume_history
  add column if not exists env text not null default 'dev';

alter table public.interview_prep_history
  add column if not exists env text not null default 'dev';

update public.resume_history
set env = 'dev'
where env is null or env = '';

update public.interview_prep_history
set env = 'dev'
where env is null or env = '';

alter table public.resume_history
  drop constraint if exists resume_history_env_check;
alter table public.resume_history
  add constraint resume_history_env_check check (env in ('dev', 'prod'));

alter table public.interview_prep_history
  drop constraint if exists interview_prep_history_env_check;
alter table public.interview_prep_history
  add constraint interview_prep_history_env_check check (env in ('dev', 'prod'));

create index if not exists resume_history_device_env_active_idx
  on public.resume_history (device_id, env, created_at desc)
  where deleted_at is null;

create index if not exists interview_prep_history_device_env_active_idx
  on public.interview_prep_history (device_id, env, updated_at desc)
  where deleted_at is null;
