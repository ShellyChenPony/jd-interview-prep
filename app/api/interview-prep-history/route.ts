import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import {
  deriveJdTitle,
  listMetaFromRow,
  parseStoredQuestions,
} from '@/lib/interview-prep-history';
import { CoverLetterSchema, JdResumeMatchSchema } from '@/lib/interview-prep';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

function deviceIdFrom(req: Request): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id || null;
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured', items: [] },
      { status: 503 }
    );
  }

  const deviceId = deviceIdFrom(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('interview_prep_history')
    .select(
      'id, jd_title, job_summary, questions_json, match_json, cover_letter_json, resume_label, created_at, updated_at'
    )
    .eq('device_id', deviceId)
    .eq('env', env)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[interview-prep-history GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => listMetaFromRow(row));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
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
    coverLetter?: unknown;
    resumeHistoryId?: unknown;
    resumeLabel?: unknown;
  };

  const jdText = typeof payload.jdText === 'string' ? payload.jdText.trim() : '';
  if (!jdText) {
    return NextResponse.json({ error: 'Missing JD text' }, { status: 400 });
  }

  const jobSummary =
    typeof payload.jobSummary === 'string' ? payload.jobSummary.trim() : '';
  const questions = parseStoredQuestions(payload.questions ?? []);
  const matchParsed =
    payload.match === undefined || payload.match === null
      ? null
      : JdResumeMatchSchema.safeParse(payload.match);
  if (matchParsed && !matchParsed.success) {
    return NextResponse.json({ error: 'Invalid match payload' }, { status: 400 });
  }
  const match = matchParsed?.success ? matchParsed.data : null;

  const coverParsed =
    payload.coverLetter === undefined || payload.coverLetter === null
      ? null
      : CoverLetterSchema.safeParse(payload.coverLetter);
  if (coverParsed && !coverParsed.success) {
    return NextResponse.json({ error: 'Invalid cover letter payload' }, { status: 400 });
  }
  const coverLetter = coverParsed?.success ? coverParsed.data : null;

  const resumeHistoryId =
    typeof payload.resumeHistoryId === 'string' && payload.resumeHistoryId.trim()
      ? payload.resumeHistoryId.trim()
      : null;
  const resumeLabel =
    typeof payload.resumeLabel === 'string' ? payload.resumeLabel.trim() : '';

  const now = new Date().toISOString();
  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('interview_prep_history')
    .insert({
      device_id: deviceId,
      env,
      jd_text: jdText,
      jd_title: deriveJdTitle(jdText, jobSummary),
      job_summary: jobSummary,
      questions_json: questions,
      match_json: match,
      cover_letter_json: coverLetter,
      resume_history_id: resumeHistoryId,
      resume_label: resumeLabel,
      updated_at: now,
    })
    .select(
      'id, jd_title, job_summary, questions_json, match_json, cover_letter_json, resume_label, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('[interview-prep-history POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: listMetaFromRow(data) }, { status: 201 });
}
