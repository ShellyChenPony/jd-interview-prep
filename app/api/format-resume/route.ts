import { Output, streamText } from 'ai';
import { enforceAiQuota } from '@/lib/ai-quota';
import {
  briefToPromptBlock,
  CustomTemplateBriefSchema,
} from '@/lib/custom-resume-templates';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';
import { ResumeTemplateSchema } from '@/lib/resume-template';

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = await enforceAiQuota(req, 'format-resume');
  if (denied) return denied;

  const body = await req.json();
  const resumeText = body?.resumeText;
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));
  const customParsed = CustomTemplateBriefSchema.safeParse(body?.customTemplate);
  const customTemplate = customParsed.success ? customParsed.data : null;

  if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
    return new Response('Missing resume content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const customBlock = customTemplate
    ? `\n${briefToPromptBlock(customTemplate)}\n
Task: Rewrite the USER resume so it follows the uploaded PDF template's structure, section order, bullet density, and professional tone as closely as possible, while still returning our fixed JSON schema.
- Mirror how the template organizes Summary / Skills / Experience / Education / Projects when present.
- Keep factual content from the USER resume only.
- If the template has sections the user lacks, omit or leave empty arrays — do not invent.
- If the user has content the template omits, still include it in the closest matching schema fields.\n`
    : '';

  const result = streamText({
    model: getChatModel(),
    output: Output.object({ schema: ResumeTemplateSchema }),
    prompt: `You are an expert resume coach for tech and remote jobs.

Rewrite and reorganize the raw USER resume content below into a clean, professional resume in ${language.promptName}.
${customBlock}
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

USER resume content (facts to keep):
---
${resumeText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
