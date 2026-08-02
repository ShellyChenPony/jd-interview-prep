-- NZ-style cover / recommendation letter stored with each prep session.
alter table public.interview_prep_history
  add column if not exists cover_letter_json jsonb;
