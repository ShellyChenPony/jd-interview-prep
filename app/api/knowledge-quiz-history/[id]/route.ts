import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import { ownerFilter, resolveOwnerIdentity } from '@/lib/auth/identity';
import {
  parseStoredAnswers,
  parseStoredQuiz,
  recordFromRow,
  scoreFromAnswers,
} from '@/lib/knowledge-quiz-history';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const resolved = await resolveOwnerIdentity(req);
  if (!resolved.ok) return resolved.response;

  const { id } = await params;
  const env = getAppEnv();
  const owner = ownerFilter(resolved.identity);
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_quiz_history')
    .select(
      'id, role_title, category_id, quiz_level, question_count, score, language, quiz_json, answers_json, created_at, updated_at'
    )
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[knowledge-quiz-history GET id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: recordFromRow(data) });
}

export async function PATCH(req: Request, { params }: Params) {
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

  const payload = body as { answers?: unknown };
  const answers =
    payload.answers && typeof payload.answers === 'object' && !Array.isArray(payload.answers)
      ? Object.fromEntries(
          Object.entries(payload.answers as Record<string, unknown>).filter(
            (entry): entry is [string, number] =>
              typeof entry[1] === 'number' && Number.isInteger(entry[1]) && entry[1] >= 0
          )
        )
      : null;

  if (!answers) {
    return NextResponse.json({ error: 'Missing answers' }, { status: 400 });
  }

  const { id } = await params;
  const env = getAppEnv();
  const owner = ownerFilter(resolved.identity);
  const supabase = getSupabaseServer();

  const existing = await supabase
    .from('knowledge_quiz_history')
    .select('id, quiz_json')
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing.error) {
    console.error('[knowledge-quiz-history PATCH load]', existing.error);
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const quiz = parseStoredQuiz(existing.data.quiz_json);
  const normalizedAnswers = parseStoredAnswers(answers);
  const score = scoreFromAnswers(quiz, normalizedAnswers);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('knowledge_quiz_history')
    .update({
      answers_json: normalizedAnswers,
      score,
      updated_at: now,
    })
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .select(
      'id, role_title, category_id, quiz_level, question_count, score, language, quiz_json, answers_json, created_at, updated_at'
    )
    .maybeSingle();

  if (error) {
    console.error('[knowledge-quiz-history PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: recordFromRow(data) });
}

export async function DELETE(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const resolved = await resolveOwnerIdentity(req);
  if (!resolved.ok) return resolved.response;

  const { id } = await params;
  const now = new Date().toISOString();
  const env = getAppEnv();
  const owner = ownerFilter(resolved.identity);
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_quiz_history')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[knowledge-quiz-history DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
