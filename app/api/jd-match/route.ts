import { Output, streamText } from 'ai';
import { JdResumeMatchSchema } from '@/lib/interview-prep';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';
import { ResumeTemplateSchema } from '@/lib/resume-template';

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const jdText = body?.jdText;
  const parsedResume = ResumeTemplateSchema.safeParse(body?.resume);
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));

  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return new Response('Missing JD content', { status: 400 });
  }

  if (!parsedResume.success) {
    return new Response('Invalid resume payload', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const resume = parsedResume.data;

  const result = streamText({
    model: getChatModel(),
    temperature: 0.5,
    output: Output.object({ schema: JdResumeMatchSchema }),
    prompt: `You are a hiring manager and career coach for remote tech roles.

Compare the Job Description (JD) with the candidate resume below.
Return raw JSON only (no markdown code fences).

Produce:
1. overallFit: 2-3 sentences on overall suitability
2. fitScore: integer 0-100
3. strongMatches: 3-6 points where the resume clearly fits the JD (with evidence from resume)
4. gaps: 3-6 points that are missing, weak, or mismatched vs JD (with impact)
5. improvementPlan: 4-7 concrete actions to improve before applying. Each action needs:
   - priority: high | medium | low
   - detail: how to improve (projects, talking points, skills to practice)
   - reviewLinks: 1-3 real https reference links (official docs preferred). Do NOT invent fake URLs.

Be specific to THIS JD and THIS resume. Do not invent employers or projects not in the resume.
Write ALL analysis text (overallFit, points, evidence, impact, actions, details, link titles) in ${language.promptName}. URLs stay as-is.

JD:
---
${jdText.trim()}
---

Resume JSON:
${JSON.stringify(resume)}
`,
  });

  return result.toTextStreamResponse();
}
