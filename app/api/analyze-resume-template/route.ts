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
    temperature: 0.2,
    output: Output.object({ schema: AnalyzedPdfTemplateSchema }),
    prompt: `You analyze a resume TEMPLATE PDF (text extracted). Infer a visual layout profile so our HTML renderer can approximate the PDF.

This is a layout/style reference, not the candidate's own resume.
Return raw JSON only (no markdown code fences).
Write name and styleNotes in ${language.promptName}.

Rules for layoutProfile:
- columns: use sidebar-left/sidebar-right if contact/skills clearly sit in a side column; else single.
- headerStyle: banner if a solid colored header band is likely; centered if name is centered; split if name left / contact right; else plain.
- sidebarSections: ordered blocks that belong in the side column (contact, skills, summary, education). Empty if single column.
- mainSectionOrder: ordered main-column sections among summary, skills, experience, education, projects. Put experience before education unless the template clearly reverses that.
- sectionTitleStyle: accent-bar for left rail titles; underline for bottom-border titles; plain-caps otherwise.
- density: compact for dense bullet-heavy resumes; spacious for airy ones; else comfortable.
- contactPlacement / skillsPlacement must be consistent with columns and sidebarSections.
- accentHint / backgroundHint: only set #RRGGBB when the text strongly suggests a brand color; otherwise omit or empty string.
- layout (legacy): classic | sidebar | banner | timeline — closest of the four.

Filename hint: "${filename}"

Template text:
---
${truncateTemplateText(templateText)}
---
`,
  });

  return result.toTextStreamResponse();
}
