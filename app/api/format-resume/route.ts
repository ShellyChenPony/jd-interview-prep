import { Output, streamText } from 'ai';
import {
  DEFAULT_RESUME_LANGUAGE,
  getResumeLanguage,
  isResumeLanguageCode,
} from '@/lib/resume-languages';
import { ResumeTemplateSchema } from '@/lib/resume-template';
import { getChatModel } from '@/lib/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const resumeText = body?.resumeText;
  const languageCode = isResumeLanguageCode(body?.language)
    ? body.language
    : DEFAULT_RESUME_LANGUAGE;
  const language = getResumeLanguage(languageCode);

  if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
    return new Response('Missing resume content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const result = streamText({
    model: getChatModel(),
    output: Output.object({ schema: ResumeTemplateSchema }),
    prompt: `You are an expert resume coach for tech and remote jobs.

Rewrite and reorganize the raw resume content below into a clean, professional resume in ${language.promptName} that fits our structured template.

Return raw JSON only (no markdown code fences).

Rules:
- Output language MUST be ${language.promptName} for all generated fields (name can stay as-is if it is already a proper name; title, summary, skills categories, experience bullets, education, and projects must be in ${language.promptName}).
- Preserve factual content (companies, dates, schools, skills). Do not invent employers or degrees.
- Polish wording into clear, achievement-oriented language (STAR-style bullets with metrics when present).
- If the source language differs from ${language.promptName}, translate naturally and professionally.
- Fill missing contact fields with empty strings.
- Group skills logically. Put experience newest-first.
- If projects are absent, return an empty projects array.
- Keep summary concise (2–4 sentences). Prefer 2–5 bullets per role.
- Keep company names, product names, and well-known tech terms accurate; translate surrounding prose into ${language.promptName}.

Raw resume content:
---
${resumeText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
