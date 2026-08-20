import { streamText } from 'ai';
import { enforceAiQuota } from '@/lib/ai-quota';
import { getChatModel } from '@/lib/openai';
import { getResumeLanguage, normalizeResumeLanguage } from '@/lib/resume-languages';

export const maxDuration = 45;

export async function POST(req: Request) {
  const denied = await enforceAiQuota(req, 'knowledge-quiz-ask');
  if (denied) return denied;

  const body = await req.json();
  const language = getResumeLanguage(normalizeResumeLanguage(body?.language));
  const followUp =
    typeof body?.followUp === 'string' ? body.followUp.trim() : '';
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const explanation =
    typeof body?.explanation === 'string' ? body.explanation.trim() : '';
  const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
  const options = Array.isArray(body?.options)
    ? body.options.filter((o: unknown) => typeof o === 'string')
    : [];
  const correctIndex =
    typeof body?.correctIndex === 'number' ? body.correctIndex : null;

  if (!followUp) {
    return new Response('Missing followUp', { status: 400 });
  }
  if (!question) {
    return new Response('Missing question context', { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const correct =
    correctIndex != null && options[correctIndex]
      ? String(options[correctIndex])
      : '(unknown)';

  const result = streamText({
    model: getChatModel(),
    temperature: 0.4,
    prompt: `You are a patient technical interview coach. The learner finished a quiz item and asks a follow-up.

Reply in ${language.promptName}.
Be concise (about 120-220 words), concrete, and practical. Use short paragraphs or bullets when helpful.
If showing code, keep snippets small. Do not refuse normal technical clarification.

Quiz item context:
- topic: ${topic || 'n/a'}
- question: ${question}
- options: ${options.map((o: string, i: number) => `${i}. ${o}`).join(' | ') || 'n/a'}
- correct option: ${correct}
- explanation already shown: ${explanation || 'n/a'}

Learner follow-up:
---
${followUp}
---
`,
  });

  return result.toTextStreamResponse();
}
