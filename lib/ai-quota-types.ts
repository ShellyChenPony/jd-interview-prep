/** Billable AI features (LLM calls). */
export type AiFeature =
  | 'format-resume'
  | 'generate'
  | 'jd-match'
  | 'cover-letter'
  | 'practice-recommend'
  | 'knowledge-quiz'
  | 'knowledge-quiz-ask'
  | 'resume-interview'
  | 'analyze-resume-template';

export const AI_FEATURES: AiFeature[] = [
  'format-resume',
  'generate',
  'jd-match',
  'cover-letter',
  'practice-recommend',
  'knowledge-quiz',
  'knowledge-quiz-ask',
  'resume-interview',
  'analyze-resume-template',
];

export type AiQuotaFeatureStatus = {
  feature: AiFeature;
  used: number;
  limit: number;
  remaining: number;
};

export type AiQuotaSnapshot = {
  day: string;
  env: string;
  features: AiQuotaFeatureStatus[];
  totalUsed: number;
  totalLimit: number;
  totalRemaining: number;
};
