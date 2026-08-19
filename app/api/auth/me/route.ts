import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ user: null });
    }

    let profile: {
      id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
      provider: string | null;
    } | null = null;

    if (isSupabaseConfigured()) {
      const admin = getSupabaseServer();
      const { data: row } = await admin
        .from('profiles')
        .select('id, email, full_name, avatar_url, provider')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = row ?? null;
    }

    const meta = data.user.user_metadata ?? {};
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email ?? profile?.email ?? null,
        fullName:
          profile?.full_name ||
          (typeof meta.full_name === 'string' ? meta.full_name : null) ||
          (typeof meta.name === 'string' ? meta.name : null),
        avatarUrl:
          profile?.avatar_url ||
          (typeof meta.avatar_url === 'string' ? meta.avatar_url : null) ||
          (typeof meta.picture === 'string' ? meta.picture : null),
        provider: profile?.provider || data.user.app_metadata?.provider || null,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
