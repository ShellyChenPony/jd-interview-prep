import { Output, streamText } from 'ai';
import { ResumeTemplateSchema } from '@/lib/resume-template';
import { defaultChatModel, openai } from '@/lib/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { resumeText } = await req.json();

  if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
    return new Response('Missing resume content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const result = streamText({
    model: openai(defaultChatModel),
    output: Output.object({ schema: ResumeTemplateSchema }),
    prompt: `You are an expert resume coach for remote English-speaking tech jobs.

Rewrite and reorganize the raw resume content below into a clean, professional English resume that fits our structured template.

Rules:
- Preserve factual content (companies, dates, schools, skills). Do not invent employers or degrees.
- Polish wording into clear, achievement-oriented English (STAR-style bullets with metrics when present).
- If the source is Chinese (or mixed), translate into natural professional English.
- Fill missing contact fields with empty strings.
- Group skills logically. Put experience newest-first.
- If projects are absent, return an empty projects array.
- Keep summary concise (2–4 sentences). Prefer 2–5 bullets per role.

Raw resume content:
---
${resumeText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
