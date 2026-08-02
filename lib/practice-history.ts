import { z } from 'zod';
import { getProblemById } from '@/lib/leetcode-catalog';
import {
  PracticeRecommendSchema,
  resolveRecommendations,
  type PracticeRecommendResult,
  type ResolvedRecommendation,
} from '@/lib/practice';

export type PracticeHistoryListItem = {
  id: string;
  jd_title: string;
  detected_role: string;
  primary_category: string;
  recommendation_count: number;
  created_at: string;
  updated_at: string;
};

export type PracticeHistoryRecord = PracticeHistoryListItem & {
  jd_text: string;
  focus_areas: string[];
  recommendations: ResolvedRecommendation[];
  raw: PracticeRecommendResult | null;
};

export function deriveJdTitle(jdText: string, detectedRole?: string): string {
  const fromRole = detectedRole?.trim();
  if (fromRole) return fromRole.slice(0, 120);
  const line =
    jdText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean) ?? '';
  return (line || 'Untitled JD').slice(0, 120);
}

export function parseStoredRecommend(value: unknown): PracticeRecommendResult | null {
  if (value == null) return null;
  const parsed = PracticeRecommendSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  // Looser read for older / partial rows
  const loose = z
    .object({
      detectedRole: z.string().optional(),
      primaryCategory: z.string().optional(),
      focusAreas: z.array(z.string()).optional(),
      recommendations: z
        .array(
          z.object({
            problemId: z.string(),
            priority: z.string().optional(),
            reason: z.string().optional(),
          })
        )
        .optional(),
    })
    .safeParse(value);

  if (!loose.success || !loose.data.recommendations?.length) return null;

  return {
    detectedRole: loose.data.detectedRole ?? '',
    primaryCategory: (loose.data.primaryCategory as PracticeRecommendResult['primaryCategory']) ?? 'general',
    focusAreas: loose.data.focusAreas ?? [],
    recommendations: loose.data.recommendations.map((r) => ({
      problemId: r.problemId,
      priority: r.priority ?? 'medium',
      reason: r.reason ?? '',
    })),
  };
}

export function listMetaFromRow(row: {
  id: string;
  jd_title: string;
  recommend_json: unknown;
  created_at: string;
  updated_at: string;
}): PracticeHistoryListItem {
  const raw = parseStoredRecommend(row.recommend_json);
  const resolved = raw ? resolveRecommendations(raw) : [];
  return {
    id: row.id,
    jd_title: row.jd_title,
    detected_role: raw?.detectedRole ?? '',
    primary_category: raw?.primaryCategory ?? '',
    recommendation_count: resolved.length,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function recordFromRow(row: {
  id: string;
  jd_text: string;
  jd_title: string;
  recommend_json: unknown;
  created_at: string;
  updated_at: string;
}): PracticeHistoryRecord {
  const meta = listMetaFromRow(row);
  const raw = parseStoredRecommend(row.recommend_json);
  const recommendations = raw ? resolveRecommendations(raw) : [];
  return {
    ...meta,
    jd_text: row.jd_text ?? '',
    focus_areas: raw?.focusAreas ?? [],
    recommendations,
    raw,
  };
}

/** Drop recommendations whose problemId is no longer in catalog. */
export function sanitizeRecommend(result: PracticeRecommendResult): PracticeRecommendResult {
  const recommendations = result.recommendations.filter((r) => getProblemById(r.problemId));
  return { ...result, recommendations };
}
