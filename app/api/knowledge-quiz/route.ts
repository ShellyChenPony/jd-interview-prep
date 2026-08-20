import { Output, streamText } from 'ai';
import { enforceAiQuota } from '@/lib/ai-quota';
import {
  JOB_CATEGORIES,
  type JobCategoryId,
} from '@/lib/leetcode-catalog';
import {
  KnowledgeQuizSchema,
  QUIZ_FOCUS_BY_CATEGORY,
  QUIZ_LEVEL_GUIDANCE,
  QUIZ_LEVELS,
  type QuizLevel,
} from '@/lib/knowledge-quiz';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';

export const maxDuration = 60;

function normalizeQuizLevel(value: unknown): QuizLevel {
  if (typeof value === 'string' && (QUIZ_LEVELS as readonly string[]).includes(value)) {
    return value as QuizLevel;
  }
  return 'mid';
}

export async function POST(req: Request) {
  const denied = await enforceAiQuota(req, 'knowledge-quiz');
  if (denied) return denied;

  const body = await req.json();
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));
  const categoryId = body?.categoryId as JobCategoryId | undefined;
  const quizLevel = normalizeQuizLevel(body?.quizLevel);
  const category = JOB_CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return new Response('Invalid or missing categoryId', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const focus = QUIZ_FOCUS_BY_CATEGORY[category.id];
  const levelGuide = QUIZ_LEVEL_GUIDANCE[quizLevel];
  const roleLabel =
    language.code === 'zh-CN' ? category.labelZh : category.labelEn;
  const roleDesc =
    language.code === 'zh-CN' ? category.descriptionZh : category.descriptionEn;

  const result = streamText({
    model: getChatModel(),
    temperature: 0.45,
    output: Output.object({ schema: KnowledgeQuizSchema }),
    prompt: `You are a technical interview coach. Build a multiple-choice knowledge quiz for the practice track below.

Return raw JSON only (no markdown fences).

Track:
- categoryId: ${category.id}
- quizLevel: ${quizLevel}
- level guidance: ${levelGuide}
- roleTitle: ${roleLabel}
- description: ${roleDesc}
- topic focus: ${focus}

Rules:
1. categoryId MUST be exactly "${category.id}".
2. quizLevel MUST be exactly "${quizLevel}".
3. roleTitle should be a short quiz title for this track (can refine ${roleLabel}).
4. focusTopics: 4-6 short topic labels covered by the quiz, matching ${quizLevel} expectations.
5. questions: 8 multiple-choice items (min 6, max 10).
6. Each question needs: id (q1..), topic, difficulty (easy|medium|hard), question, codeSnippet (string, "" if none), options (exactly 4), correctIndex (0-3), explanation, relatedLinks (2-4 preferred, or []).
7. question is the stem ONLY — do not paste multi-line code into question.
8. If the item needs a code sample, put it in codeSnippet as plain source (no markdown fences). Otherwise codeSnippet MUST be "".
9. Short identifiers in question/options may use single backticks like \`Promise.then\`.
10. explanation must be a self-contained mini-lesson (not just "correct because…"). Always include:
    a) Why the chosen answer is right (1-2 sentences).
    b) Why the most tempting wrong options fail (brief).
    c) The correct / recommended way to write or use it: paste a short corrected code sample in \`\`\`js fences when the question involves buggy/code-order examples (e.g. missing useEffect deps → show the fixed useEffect with [] or proper deps); OR give a numbered best-practice checklist (3-5 bullets) for conceptual questions.
    d) One memorable takeaway sentence.
    Goal: a diligent learner should not need to ask "then what's the best practice?" as a follow-up.
11. relatedLinks: prefer 2-4 real https links (MDN / official docs). Use [] only if none fit. Do not invent fake domains.
12. Tag difficulty honestly. Match overall quizLevel: ${levelGuide}
13. Prefer practical interview concepts over trivia. Avoid LeetCode puzzle wording.
14. Write roleTitle, focusTopics, question, options, explanation, relatedLinks.title, and codeSnippet comments/strings in ${language.promptName}.
15. correctIndex must match the correct option.
16. Every JSON property listed above is required on each question object (use "" or [] when empty).
`,
  });

  return result.toTextStreamResponse();
}
