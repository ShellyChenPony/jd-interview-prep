import { NextResponse } from 'next/server';
import {
  deriveJdTitle,
  listMetaFromRow,
  parseStoredMatch,
  parseStoredQuestions,
  type InterviewPrepHistoryRecord,
} from '@/lib/interview-prep-history';
import { JdResumeMatchSchema } from '@/lib/interview-prep';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

function deviceIdFrom(req: Request): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id || null;
}

export async function GET(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const deviceId = deviceIdFrom(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('interview_prep_history')
    .select(
      'id, jd_text, jd_title, job_summary, questions_json, match_json, resume_history_id, resume_label, created_at, updated_at'
    )
    .eq('id', id)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error('[interview-prep-history GET id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const meta = listMetaFromRow(data);
  const item: InterviewPrepHistoryRecord = {
    ...meta,
    jd_text: data.jd_text ?? '',
    questions_json: parseStoredQuestions(data.questions_json),
    match_json: parseStoredMatch(data.match_json),
    resume_history_id: data.resume_history_id ?? null,
  };

  return NextResponse.json({ item });
}

export async function PATCH(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const deviceId = deviceIdFrom(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body as {
    jdText?: unknown;
    jobSummary?: unknown;
    questions?: unknown;
    match?: unknown;
    resumeHistoryId?: unknown;
    resumeLabel?: unknown;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof payload.jdText === 'string') {
    updates.jd_text = payload.jdText.trim();
  }
  if (typeof payload.jobSummary === 'string') {
    updates.job_summary = payload.jobSummary.trim();
  }
  if (payload.questions !== undefined) {
    updates.questions_json = parseStoredQuestions(payload.questions);
  }
  if (payload.match !== undefined) {
    if (payload.match === null) {
      updates.match_json = null;
    } else {
      const parsed = JdResumeMatchSchema.safeParse(payload.match);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid match payload' }, { status: 400 });
      }
      updates.match_json = parsed.data;
    }
  }
  if (payload.resumeHistoryId !== undefined) {
    updates.resume_history_id =
      typeof payload.resumeHistoryId === 'string' && payload.resumeHistoryId.trim()
        ? payload.resumeHistoryId.trim()
        : null;
  }
  if (typeof payload.resumeLabel === 'string') {
    updates.resume_label = payload.resumeLabel.trim();
  }

  if (
    typeof updates.jd_text === 'string' ||
    typeof updates.job_summary === 'string'
  ) {
    const jdText =
      typeof updates.jd_text === 'string'
        ? updates.jd_text
        : typeof payload.jdText === 'string'
          ? payload.jdText
          : '';
    const jobSummary =
      typeof updates.job_summary === 'string' ? updates.job_summary : undefined;
    if (jdText || jobSummary) {
      updates.jd_title = deriveJdTitle(
        typeof jdText === 'string' ? jdText : '',
        jobSummary
      );
    }
  }

  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('interview_prep_history')
    .update(updates)
    .eq('id', id)
    .eq('device_id', deviceId)
    .select(
      'id, jd_title, job_summary, questions_json, match_json, resume_label, created_at, updated_at'
    )
    .maybeSingle();

  if (error) {
    console.error('[interview-prep-history PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: listMetaFromRow(data) });
}

export async function DELETE(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const deviceId = deviceIdFrom(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from('interview_prep_history')
    .delete()
    .eq('id', id)
    .eq('device_id', deviceId);

  if (error) {
    console.error('[interview-prep-history DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
