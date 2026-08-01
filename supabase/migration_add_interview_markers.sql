-- Run once if resume_history already exists without interview markers column.
alter table public.resume_history
  add column if not exists interview_markers_json jsonb not null default '[]'::jsonb;
