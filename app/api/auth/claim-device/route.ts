import { NextResponse } from 'next/server';
import { getAppEnv } from '@/lib/app-env';
import { deviceIdFrom, getRequestUserId } from '@/lib/auth/identity';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

const HISTORY_TABLES = [
  'resume_history',
  'interview_prep_history',
  'practice_history',
] as const;

/**
 * Attach anonymous device history to the signed-in Google account.
 * Only claims rows that still have user_id IS NULL.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const userId = await getRequestUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const deviceId = deviceIdFrom(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  const env = getAppEnv();
  const supabase = getSupabaseServer();
  const claimed: Record<string, number> = {};

  for (const table of HISTORY_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .update({ user_id: userId })
      .eq('device_id', deviceId)
      .eq('env', env)
      .is('user_id', null)
      .select('id');

    if (error) {
      console.error(`[auth/claim-device] ${table}`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    claimed[table] = data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, claimed });
}
