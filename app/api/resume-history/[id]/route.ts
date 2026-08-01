import { NextResponse } from 'next/server';
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
    .select('id, name, job_title, source_filename, source_text, language, resume_json, created_at')
    .eq('id', id)
    .eq('device_id', deviceId)
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
    },
  });
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
    .from('resume_history')
    .delete()
    .eq('id', id)
    .eq('device_id', deviceId);

  if (error) {
    console.error('[resume-history DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
