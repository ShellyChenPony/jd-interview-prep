import { Output, streamText } from 'ai';
import { catalogDigestForPrompt } from '@/lib/leetcode-catalog';
import { getChatModel } from '@/lib/openai';
import { PracticeRecommendSchema } from '@/lib/practice';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const jdText = body?.jdText;
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));

  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return new Response('Missing JD content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const catalog = catalogDigestForPrompt();

  const result = streamText({
    model: getChatModel(),
    temperature: 0.4,
    output: Output.object({ schema: PracticeRecommendSchema }),
    prompt: `You are a technical interview coach specializing in LeetCode prep for remote / NZ tech roles.

Given a Job Description, recommend which LeetCode problems the candidate should practice.
You MUST only pick problemId values from the CATALOG below (exact id strings). Do not invent problems.

Return raw JSON only (no markdown fences).

Rules:
1. Infer detectedRole and primaryCategory (one of: frontend, backend, fullstack, mobile, data, devops, general).
2. focusAreas: 3-5 short topic labels (e.g. "sliding window", "graph BFS", "LRU / design").
3. recommendations: 8-10 problems from the catalog, mix of Easy/Medium (1 Hard max unless JD is clearly senior algorithms-heavy).
4. Prioritize problems whose categories/tags match the JD stack and interview style.
5. priority must be "high", "medium", or "low".
6. reason must explain relevance to THIS JD.
7. Write detectedRole, focusAreas, and reason text in ${language.promptName}.
8. problemId must match catalog ids exactly (e.g. "two-sum", "lru-cache").

CATALOG (id|#num|title|difficulty|tags|cats):
${catalog}

JD:
---
${jdText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
