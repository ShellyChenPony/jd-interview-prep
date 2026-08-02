import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import {
  deriveJdTitle,
  listMetaFromRow,
  sanitizeRecommend,
} from '@/lib/practice-history';
import { PracticeRecommendSchema } from '@/lib/practice';
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
    .from('practice_history')
    .select('id, jd_title, recommend_json, created_at, updated_at')
    .eq('device_id', deviceId)
    .eq('env', env)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[practice-history GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []).map((row) => listMetaFromRow(row)) });
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

  const payload = body as { jdText?: unknown; recommend?: unknown };
  const jdText = typeof payload.jdText === 'string' ? payload.jdText.trim() : '';
  if (!jdText) {
    return NextResponse.json({ error: 'Missing JD text' }, { status: 400 });
  }

  const parsed = PracticeRecommendSchema.safeParse(payload.recommend);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid recommend payload' }, { status: 400 });
  }

  const recommend = sanitizeRecommend(parsed.data);
  const now = new Date().toISOString();
  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('practice_history')
    .insert({
      device_id: deviceId,
      env,
      jd_text: jdText,
      jd_title: deriveJdTitle(jdText, recommend.detectedRole),
      recommend_json: recommend,
      updated_at: now,
    })
    .select('id, jd_title, recommend_json, created_at, updated_at')
    .single();

  if (error) {
    console.error('[practice-history POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: listMetaFromRow(data) }, { status: 201 });
}
