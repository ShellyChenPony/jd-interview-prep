export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export type JobCategoryId =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'data'
  | 'devops'
  | 'general'
  | 'supabase';

export type ProblemKind = 'leetcode' | 'supabase';

export type JobCategory = {
  id: JobCategoryId;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
};

/**
 * How to add a problem:
 * 1. Append an object to LEETCODE_PROBLEMS (lib/leetcode-catalog.ts)
 *    or SUPABASE_PRACTICE_PROBLEMS (lib/practice-problems-supabase.ts).
 * 2. Set unique `id` / `slug`, `number`, `difficulty`, `tags`, `categories`.
 * 3. kind: 'leetcode' (default) opens leetcode.com; 'supabase' is in-app SQL.
 * 4. For in-app practice, fill promptEn/promptZh + optional starterSql / hints.
 * 5. Restart / refresh — JD recommend AI reads the same catalog automatically.
 */
export type LeetCodeProblem = {
  id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  categories: JobCategoryId[];
  /** Default 'leetcode' when omitted. */
  kind?: ProblemKind;
  promptEn?: string;
  promptZh?: string;
  hints?: string[];
  starterSql?: string;
  goalEn?: string;
  goalZh?: string;
};
