import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import {
  ownerFilter,
  ownerWriteFields,
  resolveOwnerIdentity,
} from '@/lib/auth/identity';
import {
  listMetaFromRow,
  normalizeQuizLevel,
  questionCountFromQuiz,
  sanitizeQuiz,
  scoreFromAnswers,
} from '@/lib/knowledge-quiz-history';
import { KnowledgeQuizSchema } from '@/lib/knowledge-quiz';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured', items: [] },
      { status: 503 }
    );
  }

  const resolved = await resolveOwnerIdentity(req);
  if (!resolved.ok) return resolved.response;

  const env = getAppEnv();
  const owner = ownerFilter(resolved.identity);
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_quiz_history')
    .select(
      'id, role_title, category_id, quiz_level, question_count, score, created_at, updated_at'
    )
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[knowledge-quiz-history GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => listMetaFromRow(row)),
  });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const resolved = await resolveOwnerIdentity(req);
  if (!resolved.ok) return resolved.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body as {
    quiz?: unknown;
    language?: unknown;
    answers?: unknown;
  };

  const parsed = KnowledgeQuizSchema.safeParse(payload.quiz);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid quiz payload' }, { status: 400 });
  }

  const quiz = sanitizeQuiz(parsed.data);
  const language =
    typeof payload.language === 'string' && payload.language.trim()
      ? payload.language.trim().slice(0, 32)
      : 'en';

  const answersRaw =
    payload.answers && typeof payload.answers === 'object' && !Array.isArray(payload.answers)
      ? (payload.answers as Record<string, unknown>)
      : {};
  const answers: Record<string, number> = {};
  for (const [key, raw] of Object.entries(answersRaw)) {
    if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) {
      answers[key] = raw;
    }
  }

  const questionCount = questionCountFromQuiz(quiz);
  const score = scoreFromAnswers(quiz, answers);
  const now = new Date().toISOString();
  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_quiz_history')
    .insert({
      ...ownerWriteFields(resolved.identity),
      env,
      category_id: quiz.categoryId,
      quiz_level: normalizeQuizLevel(quiz.quizLevel),
      role_title: (quiz.roleTitle || '').slice(0, 160) || 'Untitled quiz',
      language,
      quiz_json: quiz,
      answers_json: answers,
      score,
      question_count: questionCount,
      updated_at: now,
    })
    .select(
      'id, role_title, category_id, quiz_level, question_count, score, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('[knowledge-quiz-history POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: listMetaFromRow(data) }, { status: 201 });
}
