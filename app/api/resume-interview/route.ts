import { Output, streamText } from 'ai';
import {
  DEFAULT_RESUME_LANGUAGE,
  getResumeLanguage,
  isResumeLanguageCode,
} from '@/lib/resume-languages';
import { ResumeInterviewSchema } from '@/lib/resume-interview';
import { ResumeTemplateSchema } from '@/lib/resume-template';
import { getChatModel } from '@/lib/openai';

export const maxDuration = 45;

/** Rotating interview angles so each regenerate covers a different practice set. */
const FOCUS_ANGLES = [
  'deep technical implementation details and trade-offs',
  'system design / scalability / performance',
  'debugging, incident handling, and production reliability',
  'metrics, business impact, and ownership',
  'collaboration, mentorship, and cross-team communication',
  'testing strategy, quality, and release process',
  'architecture choices and alternatives considered',
  'security, privacy, and data integrity',
  'remote collaboration and async delivery practices',
  'prioritization under ambiguity and stakeholder pushback',
] as const;

function pickFocusAngles(count = 3): string[] {
  const pool = [...FOCUS_ANGLES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export async function POST(req: Request) {
  const body = await req.json();
  const languageCode = isResumeLanguageCode(body?.language)
    ? body.language
    : DEFAULT_RESUME_LANGUAGE;
  const language = getResumeLanguage(languageCode);

  const parsedResume = ResumeTemplateSchema.safeParse(body?.resume);
  if (!parsedResume.success) {
    return new Response('Invalid resume payload', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const resume = parsedResume.data;
  const previousAnchors = Array.isArray(body?.previousAnchors)
    ? body.previousAnchors
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((item: string) => item.trim())
        .filter(Boolean)
        .slice(0, 24)
    : [];

  const skillCatalog = resume.skills
    .map((group, index) => `[skill ${index}] ${group.category}: ${group.items.join(', ')}`)
    .join('\n');
  const projectCatalog = resume.projects
    .map(
      (project, index) =>
        `[project ${index}] ${project.name}: ${project.description} (tech: ${project.tech})`
    )
    .join('\n');
  const experienceCatalog = resume.experience
    .map((job, jobIndex) => {
      const bullets = job.bullets
        .map((bullet, bulletIndex) => `  - (bullet ${bulletIndex}) ${bullet}`)
        .join('\n');
      return `[experience ${jobIndex}] ${job.role} @ ${job.company}\n${bullets}`;
    })
    .join('\n');

  const focusAngles = pickFocusAngles(3);
  const sessionNonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const result = streamText({
    model: getChatModel(),
    temperature: 0.95,
    output: Output.object({ schema: ResumeInterviewSchema }),
    prompt: `You are a senior technical interviewer and career coach.

Based on this candidate resume, create a FRESH practice set of interview hotspots.
This is regenerate session ${sessionNonce}. Deliberately vary from prior sets.

Primary focus angles for THIS run (lean into these):
${focusAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n')}

${
  previousAnchors.length > 0
    ? `Previously used anchors (prefer DIFFERENT lines / different question angles):\n- ${previousAnchors.join('\n- ')}\n`
    : ''
}

Output language for questions and answers: ${language.promptName}.
Return raw JSON only (no markdown code fences).

Rules:
- Create 5-8 markers total.
- Prefer anchoring to concrete project bullets or project rows, and also 1-2 skill-group rows that are highly interviewable.
- Vary which resume lines you pick across regenerations so the candidate can practice broadly.
- Ask different question styles (why/how/trade-off/failure/metric/deep-dive), not near-duplicates.
- Each marker must reference valid indexes from the catalogs below.
- For section "skill": itemIndex must be -1; groupIndex is the skill group index.
- For section "project": itemIndex must be -1; groupIndex is the project index.
- For section "experience": groupIndex is the job index; itemIndex is the bullet index.
- Each marker has 1-2 sharp interview questions with a suggested answer, key tips, and review links.
- For every question, include 1-3 reviewLinks: real https URLs to official docs or high-quality references that help the candidate revise this topic (e.g. react.dev, nextjs.org/docs, MDN, nodejs.org, postgresql.org/docs, kubernetes.org).
- Prefer official documentation pages over blogs. Titles should be short and specific.
- Do NOT invent fake or placeholder URLs. If unsure, pick a well-known official docs homepage for that technology.
- Suggested answers should be practical, specific, and usable in interviews (STAR when relevant).
- Do not invent employers/projects that are not in the resume. Build questions from the given content.
- Marker ids must be sequential starting at 1.

Skills:
${skillCatalog || '(none)'}

Projects:
${projectCatalog || '(none)'}

Experience:
${experienceCatalog || '(none)'}

Full resume JSON for context:
${JSON.stringify(resume)}
`,
  });

  return result.toTextStreamResponse();
}
