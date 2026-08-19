import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import { ownerFilter, resolveOwnerIdentity } from '@/lib/auth/identity';
import { recordFromRow } from '@/lib/practice-history';
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
    .from('practice_history')
    .select('id, jd_text, jd_title, recommend_json, created_at, updated_at')
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[practice-history GET id]', error);
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
    .from('practice_history')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq(owner.column, owner.value)
    .eq('env', env)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[practice-history DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
