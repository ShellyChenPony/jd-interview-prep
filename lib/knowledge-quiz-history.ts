import {
  KnowledgeQuizSchema,
  QUIZ_LEVELS,
  type KnowledgeQuiz,
  type QuizLevel,
} from '@/lib/knowledge-quiz';
import type { JobCategoryId } from '@/lib/leetcode-catalog';

export type KnowledgeQuizHistoryListItem = {
  id: string;
  role_title: string;
  category_id: string;
  quiz_level: QuizLevel | string;
  question_count: number;
  score: number | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeQuizHistoryRecord = KnowledgeQuizHistoryListItem & {
  language: string;
  quiz: KnowledgeQuiz | null;
  answers: Record<string, number>;
};

export function sanitizeQuiz(quiz: KnowledgeQuiz): KnowledgeQuiz {
  const parsed = KnowledgeQuizSchema.safeParse(quiz);
  return parsed.success ? parsed.data : quiz;
}

export function parseStoredQuiz(value: unknown): KnowledgeQuiz | null {
  if (value == null) return null;
  const parsed = KnowledgeQuizSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseStoredAnswers(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) {
      out[key] = raw;
    }
  }
  return out;
}

export function normalizeQuizLevel(value: unknown): QuizLevel {
  if (typeof value === 'string' && (QUIZ_LEVELS as readonly string[]).includes(value)) {
    return value as QuizLevel;
  }
  return 'mid';
}

export function questionCountFromQuiz(quiz: KnowledgeQuiz | null): number {
  return quiz?.questions?.filter((q) => q?.id && q.question)?.length ?? 0;
}

export function scoreFromAnswers(
  quiz: KnowledgeQuiz | null,
  answers: Record<string, number>
): number | null {
  if (!quiz?.questions?.length) return null;
  let answered = 0;
  let correct = 0;
  for (const q of quiz.questions) {
    if (!q?.id || typeof q.correctIndex !== 'number') continue;
    if (typeof answers[q.id] !== 'number') continue;
    answered += 1;
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  return answered > 0 ? correct : null;
}

export function listMetaFromRow(row: {
  id: string;
  role_title: string;
  category_id: string;
  quiz_level: string;
  question_count: number;
  score: number | null;
  created_at: string;
  updated_at: string;
}): KnowledgeQuizHistoryListItem {
  return {
    id: row.id,
    role_title: row.role_title || 'Untitled quiz',
    category_id: row.category_id || '',
    quiz_level: normalizeQuizLevel(row.quiz_level),
    question_count: row.question_count ?? 0,
    score: typeof row.score === 'number' ? row.score : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function recordFromRow(row: {
  id: string;
  role_title: string;
  category_id: string;
  quiz_level: string;
  question_count: number;
  score: number | null;
  language: string;
  quiz_json: unknown;
  answers_json: unknown;
  created_at: string;
  updated_at: string;
}): KnowledgeQuizHistoryRecord {
  const quiz = parseStoredQuiz(row.quiz_json);
  const answers = parseStoredAnswers(row.answers_json);
  return {
    ...listMetaFromRow(row),
    category_id: (row.category_id || quiz?.categoryId || '') as JobCategoryId | string,
    language: row.language || 'en',
    quiz,
    answers,
  };
}
