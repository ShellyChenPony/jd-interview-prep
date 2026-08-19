import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import {
  ownerFilter,
  ownerWriteFields,
  resolveOwnerIdentity,
} from '@/lib/auth/identity';
import { parseInterviewMarkers } from '@/lib/resume-interview';
import { normalizeResumeLanguage } from '@/lib/resume-languages';
import { ResumeTemplateSchema } from '@/lib/resume-template';
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
    .from('resume_history')
    .select('id, name, job_title, source_filename, language, created_at')
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[resume-history GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
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
    resume?: unknown;
    sourceText?: string;
    sourceFilename?: string | null;
    language?: unknown;
    interviewMarkers?: unknown;
  };

  const parsed = ResumeTemplateSchema.safeParse(payload.resume);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid resume payload' }, { status: 400 });
  }

  const language = normalizeResumeLanguage(payload.language);
  const interviewMarkers = parseInterviewMarkers(payload.interviewMarkers ?? []);
  const resume = parsed.data;
  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('resume_history')
    .insert({
      ...ownerWriteFields(resolved.identity),
      env,
      name: resume.name,
      job_title: resume.title,
      source_filename: payload.sourceFilename ?? null,
      source_text: typeof payload.sourceText === 'string' ? payload.sourceText : '',
      language,
      resume_json: resume,
      interview_markers_json: interviewMarkers,
    })
    .select('id, name, job_title, source_filename, language, created_at')
    .single();

  if (error) {
    console.error('[resume-history POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
