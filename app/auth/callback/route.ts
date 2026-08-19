import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next')?.startsWith('/')
    ? searchParams.get('next')!
    : '/pages';

  if (code) {
    try {
      const supabase = await createServerAuthClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user && isSupabaseConfigured()) {
        const meta = data.user.user_metadata ?? {};
        const admin = getSupabaseServer();
        await admin.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email ?? null,
            full_name:
              (typeof meta.full_name === 'string' && meta.full_name) ||
              (typeof meta.name === 'string' && meta.name) ||
              null,
            avatar_url:
              (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
              (typeof meta.picture === 'string' && meta.picture) ||
              null,
            provider:
              (typeof data.user.app_metadata?.provider === 'string' &&
                data.user.app_metadata.provider) ||
              'google',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.error('[auth/callback]', err);
      return NextResponse.redirect(`${origin}/?authError=callback`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
