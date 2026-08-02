import { Output, streamText } from 'ai';
import { CoverLetterSchema } from '@/lib/interview-prep';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';
import { ResumeTemplateSchema } from '@/lib/resume-template';

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const jdText = body?.jdText;
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));
  const parsedResume = ResumeTemplateSchema.safeParse(body?.resume);

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
    temperature: 0.55,
    output: Output.object({ schema: CoverLetterSchema }),
    prompt: `You are a New Zealand career coach who writes cover letters (also called recommendation / application letters) for NZ job applications.

Write a polished cover letter tailored to THIS Job Description and THIS candidate resume.
Return raw JSON only (no markdown code fences).

NZ cover letter conventions:
- Warm, clear, professional tone — not overly American salesy or stiff UK formality.
- Address the hiring manager / team when possible; otherwise "Kia ora Hiring Manager," or "Dear Hiring Manager,".
- 3–4 short paragraphs: why this role/company, relevant experience matched to JD, value you'd bring, brief close with availability / next step.
- Prefer plain language; Aotearoa / NZ workplace culture values humility + concrete impact.
- Do NOT invent employers, degrees, or projects not in the resume. Soften gaps honestly rather than fabricating.
- Sign-off with the candidate's name from the resume.
- letter field must be the full copy-paste-ready letter (greeting through sign-off), with blank lines between paragraphs using \\n\\n.
- highlights: 3–5 bullet-worthy selling points used in the letter.
- tips: 2–4 short tips for submitting this letter in NZ (e.g. PDF with CV, keep to one page, mention right to work if known — only if relevant; never invent visa status).

Write ALL text fields (roleTitle, companyHint, letter, highlights, tips) in ${language.promptName}.

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
