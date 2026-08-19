import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppEnv } from '@/lib/app-env';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

const FeedbackBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  category: z.enum(['general', 'bug', 'idea', 'other']).default('general'),
  contactEmail: z.string().trim().max(254).optional(),
  pagePath: z.string().trim().max(500).optional(),
});

function deviceIdFrom(req: Request): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id || null;
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

  const parsed = FeedbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback payload' }, { status: 400 });
  }

  const { message, category, contactEmail, pagePath } = parsed.data;
  const emailRaw = contactEmail?.trim() ?? '';
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
  }
  const email = emailRaw || null;
  const env = getAppEnv();
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      device_id: deviceId,
      env,
      category,
      message,
      contact_email: email,
      page_path: pagePath?.slice(0, 500) ?? null,
      user_agent: userAgent,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('[feedback POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, createdAt: data.created_at });
}
