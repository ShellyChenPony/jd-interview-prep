import { z } from 'zod';
import {
  JOB_CATEGORIES,
  getProblemById,
  type JobCategoryId,
  type LeetCodeProblem,
} from '@/lib/leetcode-catalog';

const categoryIds = JOB_CATEGORIES.map((c) => c.id) as [
  JobCategoryId,
  ...JobCategoryId[],
];

export const PracticeRecommendSchema = z.object({
  detectedRole: z
    .string()
    .describe('Short role label inferred from the JD, e.g. Senior Frontend Engineer'),
  primaryCategory: z
    .enum(categoryIds)
    .describe('Best matching job category id from the catalog'),
  focusAreas: z
    .array(z.string())
    .describe('3-5 algorithm / topic focus areas for this JD'),
  recommendations: z
    .array(
      z.object({
        problemId: z
          .string()
          .describe('Must be an exact id from the provided catalog'),
        priority: z
          .string()
          .describe('Priority: high, medium, or low'),
        reason: z
          .string()
          .describe('Why this problem matters for THIS JD (1-2 sentences)'),
      })
    )
    .min(6)
    .max(12)
    .describe('6-12 catalog problems ranked for practice'),
});

export type PracticeRecommendResult = z.infer<typeof PracticeRecommendSchema>;

export type ResolvedRecommendation = {
  problemId: string;
  priority: string;
  reason: string;
  problem: LeetCodeProblem;
};

export function resolveRecommendations(
  result: PracticeRecommendResult
): ResolvedRecommendation[] {
  const seen = new Set<string>();
  const resolved: ResolvedRecommendation[] = [];

  for (const item of result.recommendations) {
    if (seen.has(item.problemId)) continue;
    const problem = getProblemById(item.problemId);
    if (!problem) continue;
    seen.add(item.problemId);
    resolved.push({
      problemId: item.problemId,
      priority: item.priority,
      reason: item.reason,
      problem,
    });
  }

  return resolved;
}
