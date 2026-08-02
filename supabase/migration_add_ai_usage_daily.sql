-- Daily AI usage counters for anonymous promo quotas (device_id + IP hash).

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

-- Atomic increment; returns the new count.
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
