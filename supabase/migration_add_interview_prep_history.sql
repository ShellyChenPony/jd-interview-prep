-- New table for Interview Prep tab: JD + questions + JD×Resume match analysis.
create table if not exists public.interview_prep_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  jd_text text not null default '',
  jd_title text not null default '',
  job_summary text not null default '',
  questions_json jsonb not null default '[]'::jsonb,
  match_json jsonb,
  resume_history_id uuid references public.resume_history (id) on delete set null,
  resume_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_prep_history_device_updated_idx
  on public.interview_prep_history (device_id, updated_at desc);

alter table public.interview_prep_history enable row level security;
