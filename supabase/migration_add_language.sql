-- Run once if resume_history already exists without language column.
alter table public.resume_history
  add column if not exists language text not null default 'en';
