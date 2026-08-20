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
CRITICAL — PDF template mode is ON:
- Follow the uploaded PDF template's section ORDER, headings, bullet density, and tone as closely as our JSON schema allows.
- Mirror how the template organizes Summary / Skills / Experience / Education / Projects (and similar blocks) when present.
- Prefer the template's level of detail (short vs dense bullets) over a generic rewrite.
- Keep factual content from the USER resume only — never invent from the template.
- If the template has sections the user lacks, omit or leave empty arrays.
- If the user has content the template omits, place it in the closest matching schema fields.\n`
    : '';

  const result = streamText({
    model: getChatModel(),
    output: Output.object({ schema: ResumeTemplateSchema }),
    prompt: `You are an expert resume coach for tech and remote jobs.

Rewrite and reorganize the raw USER resume content below into a clean, professional resume in ${language.promptName}.
${customBlock}
Return raw JSON only (no markdown code fences).

Rules:
- Output language MUST be ${language.promptName} for EVERY user-facing string: name, title, summary, skills, experience (role, company, location, period, bullets), education, and projects (name, description, tech).
- Name field:
  - English mode: MUST be Romanized Latin letters only (Pinyin / English resume form), e.g. 陈少利 → Shaoli Chen. Prefer any Latin name already in the source (email, LinkedIn, filename). NEVER output Chinese characters in name when language is English.
  - Chinese mode: Chinese characters are OK for the name.
- Location fields (contact.location and each experience.location):
  - English mode: MUST use English place names only, e.g. 上海市浦东新区 → Shanghai, Pudong; 北京 → Beijing; 深圳 → Shenzhen. NEVER leave Chinese characters in location.
  - Chinese mode: Chinese place names are OK.
- When output language is English: translate Chinese employer names to common English forms (携程旅游 → Ctrip, 花旗/花旗金融信息服务 → Citi, 同程旅游 → Tongcheng Travel). Do NOT leave Chinese characters in company names, project titles, descriptions, or locations.
- When output language is Chinese: use Chinese for prose; well-known English product/tech names may stay as-is.
- Preserve factual content (employers, dates, schools, skills, project names). Do not invent employers, degrees, or projects.
- Polish wording into clear, achievement-oriented language (STAR-style bullets with metrics when present).
- Fill missing contact fields with empty strings.
- Group skills logically. Put experience newest-first by end date (Present / ongoing roles first)${customTemplate ? ' unless the PDF template clearly uses a different order — then follow the template' : ''}.
- Keep summary concise (2–4 sentences)${customTemplate ? ' unless the PDF template uses a clearly different summary length — then match the template' : ''}.
- Keep product names and tech terms accurate; surrounding prose must be in ${language.promptName}.

Experience depth (recency-weighted):
- Most recent role: 4–6 strong bullets (richest detail).
- Previous role: 3–4 bullets.
- Older roles: 2–3 bullets each.
- Do not flatten every job to the same length.

Projects section (critical):
- ALWAYS extract notable projects / initiatives / deliveries from the USER text into "projects" when they exist — including work done as Project Manager / delivery lead under a company. Do not leave projects empty if the source describes them.
- SORT STRICTLY by employment timeline (identical to experience order): list EVERY project from the newest company first, THEN the previous company, THEN older. Example: if experience order is Citi → Ctrip → Tongcheng, project order must be all Citi projects, then Ctrip, then Tongcheng — never Ctrip above Citi.
- Within the same company, put the most important / largest initiatives first.
- Volume: newest company should dominate (~50–70% of entries, longer descriptions); previous company ~20–30%; older companies at most 1 short entry each.
- Typical list size: 3–6 projects.
- Name format when from employment: "Project or program — Company" using the company name in ${language.promptName} (English mode → English company name only, no Chinese).
- Experience bullets and Projects may overlap in theme, but Projects should spotlight concrete initiatives; Experience should keep role-level impact.
- Only return an empty projects array when the source truly has no project/initiative content.

USER resume content (facts to keep):
---
${resumeText.trim()}
---
`,
  });

  return result.toTextStreamResponse();
}
