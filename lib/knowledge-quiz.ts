import { z } from 'zod';
import {
  JOB_CATEGORIES,
  type JobCategoryId,
} from '@/lib/leetcode-catalog';

const categoryIds = JOB_CATEGORIES.map((c) => c.id) as [
  JobCategoryId,
  ...JobCategoryId[],
];

export const QUIZ_LEVELS = ['junior', 'mid', 'senior'] as const;
export type QuizLevel = (typeof QUIZ_LEVELS)[number];

export const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export const KnowledgeQuizItemSchema = z.object({
  id: z.string().describe('Stable id for the question, e.g. q1'),
  topic: z.string().describe('Short topic label, e.g. Closures'),
  difficulty: z
    .enum(QUIZ_DIFFICULTIES)
    .describe('Question difficulty: easy, medium, or hard'),
  question: z
    .string()
    .describe(
      'Question stem only. Put multi-line code in codeSnippet, or wrap short identifiers in backticks.'
    ),
  codeSnippet: z
    .string()
    .describe(
      // Required (not optional): DeepSeek structured output needs all properties required.
      'Multi-line code sample as plain source with no markdown fences. Use empty string "" if none.'
    ),
  options: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('3-5 answer choices; use backticks for short code tokens'),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .describe('0-based index of the correct option'),
  explanation: z
    .string()
    .describe(
      'Self-contained teaching note: (1) why the correct option is right, (2) why common wrong options fail, (3) the recommended correct code or best-practice checklist so the learner rarely needs a follow-up. Use ``` fences for corrected code snippets when relevant.'
    ),
  relatedLinks: z
    .array(
      z.object({
        title: z.string().describe('Short label for a deeper review resource'),
        url: z
          .string()
          .describe(
            'https URL to MDN, official docs, or a high-quality article for further study'
          ),
      })
    )
    .max(4)
    .describe(
      '2-4 related study links for deeper review; use [] only if none fit'
    ),
});

export const KnowledgeQuizSchema = z.object({
  categoryId: z.enum(categoryIds),
  quizLevel: z.enum(QUIZ_LEVELS).describe('Target seniority for this quiz'),
  roleTitle: z
    .string()
    .describe('Short display title for this quiz track'),
  focusTopics: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe('Topics covered in this quiz'),
  questions: z
    .array(KnowledgeQuizItemSchema)
    .min(6)
    .max(12)
    .describe('6-12 multiple-choice knowledge questions'),
});

export type KnowledgeQuiz = z.infer<typeof KnowledgeQuizSchema>;
export type KnowledgeQuizItem = z.infer<typeof KnowledgeQuizItemSchema>;

/** Prompt hints so AI quizzes match the selected practice role. */
export const QUIZ_FOCUS_BY_CATEGORY: Record<JobCategoryId, string> = {
  frontend:
    'JavaScript/TypeScript, DOM/browser APIs, React/Vue concepts, CSS layout, web performance, CORS/storage, event loop',
  backend:
    'HTTP/REST, databases/SQL/transactions, Node or similar runtimes, caching, concurrency, auth sessions/JWT, API design',
  fullstack:
    'Mix of frontend JS + backend APIs + DB modeling + auth + deployment basics for full-stack interviews',
  mobile:
    'Mobile app architecture, async UI, networking, local storage, lists/performance, platform lifecycle concepts',
  data: 'Python/SQL for data roles, stats intuition, ETL concepts, hashing/aggregation, data structures used in pipelines',
  devops:
    'Linux basics, containers/K8s concepts, CI/CD, networking/DNS, observability, IaC ideas, reliability tradeoffs',
  general:
    'Core CS for SWE: complexity, data structures, OOP vs FP, git, testing, HTTP, and language-agnostic fundamentals',
  supabase:
    'SQL joins/indexes, RLS, Postgres features, Auth roles, realtime/storage concepts, and practical Supabase patterns',
};

export const QUIZ_LEVEL_GUIDANCE: Record<QuizLevel, string> = {
  junior:
    'Junior / early-career: fundamentals, common APIs, classic pitfalls. Prefer easy–medium; at most 1 hard.',
  mid: 'Mid-level: tradeoffs, debugging mental models, production patterns. Mix medium with some hard; few pure trivia easy items.',
  senior:
    'Senior / staff-leaning: architecture judgment, performance, concurrency, security, failure modes, and cross-cutting design. Prefer medium–hard; skip baby questions.',
};
