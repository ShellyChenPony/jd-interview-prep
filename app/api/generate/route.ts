import { Output, streamText } from 'ai';
import { InterviewPrepSchema } from '@/lib/interview-prep';
import { getChatModel } from '@/lib/openai';

export const maxDuration = 90;

export async function POST(req: Request) {
  const { jdText } = await req.json();

  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return new Response('Missing JD content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const result = streamText({
    model: getChatModel(),
    temperature: 0.7,
    output: Output.object({ schema: InterviewPrepSchema }),
    prompt: `You are a senior Silicon Valley technical interviewer and career coach.

Analyze the Job Description (JD) below and generate EXACTLY 15 high-frequency interview questions in English.

Return raw JSON only (no markdown code fences).

Rules:
- Cover a broad mix: role motivation, core tech deep-dives, system design / architecture, debugging & production, collaboration / remote work, metrics & impact, trade-offs, and behavioral (STAR).
- Each question must include:
  - whyAsked: interviewer intent
  - suggestedAnswer: a strong, practical sample answer (4-8 sentences; use STAR when useful)
  - keyPoints: 2-4 short tips the candidate should hit
  - reviewLinks: 1-3 real https links to official docs or high-quality references for revising this topic (prefer react.dev, nextjs.org/docs, MDN, nodejs.org, postgresql.org/docs, aws.amazon.com/docs, etc.). Do NOT invent fake URLs; if unsure, use a well-known official docs homepage.
- Question ids must be sequential 1..15.
- jobSummary: one sentence summarizing the JD core requirements.

JD:
---
${jdText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
