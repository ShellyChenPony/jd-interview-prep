-- Google Auth: profiles + attach history rows to auth.users

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

-- Attach optional user_id to existing history tables.
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

-- Keep profiles in sync when a user signs up via Google (or any provider).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    provider = coalesce(excluded.provider, public.profiles.provider),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
