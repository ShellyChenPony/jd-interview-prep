import { Output, streamText } from 'ai';
import { enforceAiQuota } from '@/lib/ai-quota';
import {
  AnalyzedPdfTemplateSchema,
  truncateTemplateText,
} from '@/lib/custom-resume-templates';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';

export const maxDuration = 45;

export async function POST(req: Request) {
  const denied = await enforceAiQuota(req, 'analyze-resume-template');
  if (denied) return denied;

  const body = await req.json();
  const templateText = body?.templateText;
  const filename =
    typeof body?.filename === 'string' ? body.filename.trim() : 'template.pdf';
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));

  if (!templateText || typeof templateText !== 'string' || !templateText.trim()) {
    return new Response('Missing template text', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const result = streamText({
    model: getChatModel(),
    temperature: 0.3,
    output: Output.object({ schema: AnalyzedPdfTemplateSchema }),
    prompt: `You analyze a resume TEMPLATE PDF (text extracted). This is a layout/style reference, not the candidate's own resume.

Return raw JSON only (no markdown fences).
Write name and styleNotes in ${language.promptName}.
layout must be one of: classic, sidebar, banner, timeline.
name: short label for saving this template (can include hints from filename "${filename}").
styleNotes: how sections are ordered, how dense bullets are, overall tone.

Template text:
---
${truncateTemplateText(templateText)}
---
`,
  });

  return result.toTextStreamResponse();
}
