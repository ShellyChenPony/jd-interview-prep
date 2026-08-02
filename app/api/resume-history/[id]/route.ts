import { NextResponse } from 'next/server';
import { parseInterviewMarkers } from '@/lib/resume-interview';
import { ResumeTemplateSchema } from '@/lib/resume-template';
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
    .from('resume_history')
    .select(
      'id, name, job_title, source_filename, source_text, language, resume_json, interview_markers_json, created_at'
    )
    .eq('id', id)
    .eq('device_id', deviceId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[resume-history GET id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resume = ResumeTemplateSchema.safeParse(data.resume_json);
  if (!resume.success) {
    return NextResponse.json({ error: 'Stored resume is invalid' }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      ...data,
      resume_json: resume.data,
      interview_markers_json: parseInterviewMarkers(data.interview_markers_json),
    },
  });
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
    interviewMarkers?: unknown;
    resume?: unknown;
    sourceText?: string;
  };

  const updates: Record<string, unknown> = {};

  if (payload.interviewMarkers !== undefined) {
    updates.interview_markers_json = parseInterviewMarkers(payload.interviewMarkers);
  }

  if (payload.resume !== undefined) {
    const parsed = ResumeTemplateSchema.safeParse(payload.resume);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid resume payload' }, { status: 400 });
    }
    updates.resume_json = parsed.data;
    updates.name = parsed.data.name;
    updates.job_title = parsed.data.title;
  }

  if (typeof payload.sourceText === 'string') {
    updates.source_text = payload.sourceText;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('resume_history')
    .update(updates)
    .eq('id', id)
    .eq('device_id', deviceId)
    .is('deleted_at', null)
    .select('id, name, job_title, source_filename, language, created_at')
    .maybeSingle();

  if (error) {
    console.error('[resume-history PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: data });
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
  const { data, error } = await supabase
    .from('resume_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('device_id', deviceId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[resume-history DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
