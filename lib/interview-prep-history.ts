import { z } from 'zod';
import {
  CoverLetterSchema,
  InterviewPrepSchema,
  JdResumeMatchSchema,
  type CoverLetterResult,
  type InterviewPrepResult,
  type JdResumeMatchResult,
} from '@/lib/interview-prep';

const ReviewLinkStoredSchema = z.object({
  title: z.string(),
  url: z.string(),
});

/** Looser schema for reading stored questions (partial / older records OK). */
const StoredQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  whyAsked: z.string().optional(),
  suggestedAnswer: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  reviewLinks: z.array(ReviewLinkStoredSchema).optional(),
});

export type InterviewPrepHistoryListItem = {
  id: string;
  jd_title: string;
  job_summary: string;
  question_count: number;
  has_match: boolean;
  has_cover_letter: boolean;
  fit_score: number | null;
  resume_label: string;
  created_at: string;
  updated_at: string;
};

export type InterviewPrepHistoryRecord = InterviewPrepHistoryListItem & {
  jd_text: string;
  questions_json: InterviewPrepResult['questions'];
  match_json: JdResumeMatchResult | null;
  cover_letter_json: CoverLetterResult | null;
  resume_history_id: string | null;
};

export function deriveJdTitle(jdText: string, jobSummary?: string): string {
  const fromSummary = jobSummary?.trim();
  if (fromSummary) return fromSummary.slice(0, 120);

  const line =
    jdText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean) ?? '';
  return (line || 'Untitled JD').slice(0, 120);
}

export function parseStoredQuestions(value: unknown): InterviewPrepResult['questions'] {
  const asArray = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { questions?: unknown }).questions)
      ? (value as { questions: unknown[] }).questions
      : [];

  const parsed = z.array(StoredQuestionSchema).safeParse(asArray);
  if (!parsed.success) return [];
  return parsed.data.map((item) => ({
    id: item.id,
    question: item.question,
    whyAsked: item.whyAsked ?? '',
    suggestedAnswer: item.suggestedAnswer ?? '',
    keyPoints: item.keyPoints ?? [],
    reviewLinks: item.reviewLinks ?? [],
  }));
}

export function parseStoredMatch(value: unknown): JdResumeMatchResult | null {
  if (value == null) return null;
  const parsed = JdResumeMatchSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseStoredCoverLetter(value: unknown): CoverLetterResult | null {
  if (value == null) return null;
  const parsed = CoverLetterSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toInterviewPrepResult(
  jobSummary: string,
  questions: InterviewPrepResult['questions']
): InterviewPrepResult | null {
  const parsed = InterviewPrepSchema.safeParse({ jobSummary, questions });
  if (parsed.success) return parsed.data;
  // Still return a usable object for UI even if count < 10.
  if (!questions.length && !jobSummary.trim()) return null;
  return { jobSummary, questions };
}

export function listMetaFromRow(row: {
  id: string;
  jd_title: string;
  job_summary: string;
  questions_json: unknown;
  match_json: unknown;
  cover_letter_json?: unknown;
  resume_label: string;
  created_at: string;
  updated_at: string;
}): InterviewPrepHistoryListItem {
  const questions = parseStoredQuestions(row.questions_json);
  const match = parseStoredMatch(row.match_json);
  const coverLetter = parseStoredCoverLetter(row.cover_letter_json);
  return {
    id: row.id,
    jd_title: row.jd_title,
    job_summary: row.job_summary,
    question_count: questions.length,
    has_match: Boolean(match),
    has_cover_letter: Boolean(coverLetter),
    fit_score: typeof match?.fitScore === 'number' ? match.fitScore : null,
    resume_label: row.resume_label ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
