import type { ResumeTemplate } from '@/lib/resume-template';

export type ResumeHistoryListItem = {
  id: string;
  name: string;
  job_title: string;
  source_filename: string | null;
  created_at: string;
};

export type ResumeHistoryRecord = ResumeHistoryListItem & {
  source_text: string;
  resume_json: ResumeTemplate;
};
