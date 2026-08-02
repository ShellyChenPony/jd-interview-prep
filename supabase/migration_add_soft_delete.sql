-- Soft delete: mark deleted_at instead of removing rows.
alter table public.resume_history
  add column if not exists deleted_at timestamptz;

alter table public.interview_prep_history
  add column if not exists deleted_at timestamptz;

create index if not exists resume_history_device_active_idx
  on public.resume_history (device_id, created_at desc)
  where deleted_at is null;

create index if not exists interview_prep_history_device_active_idx
  on public.interview_prep_history (device_id, updated_at desc)
  where deleted_at is null;
