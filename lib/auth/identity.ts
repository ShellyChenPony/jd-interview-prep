import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/lib/supabase/server-auth';

export type OwnerIdentity = {
  userId: string | null;
  deviceId: string;
};

export function deviceIdFrom(req: Request): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id || null;
}

export async function getRequestUserId(): Promise<string | null> {
  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Resolve ownership for history APIs.
 * Logged-in users are scoped by user_id; anonymous by device_id.
 */
export async function resolveOwnerIdentity(
  req: Request
): Promise<
  { ok: true; identity: OwnerIdentity } | { ok: false; response: NextResponse }
> {
  const deviceId = deviceIdFrom(req);
  const userId = await getRequestUserId();

  if (!userId && !deviceId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing device id' }, { status: 400 }),
    };
  }

  return {
    ok: true,
    identity: {
      userId,
      deviceId: deviceId ?? '',
    },
  };
}

/** Column used to scope rows for the current identity. */
export function ownerFilter(identity: OwnerIdentity): {
  column: 'user_id' | 'device_id';
  value: string;
} {
  if (identity.userId) {
    return { column: 'user_id', value: identity.userId };
  }
  return { column: 'device_id', value: identity.deviceId };
}

export function ownerWriteFields(identity: OwnerIdentity): {
  device_id: string;
  user_id: string | null;
} {
  return {
    device_id: identity.deviceId || 'unknown',
    user_id: identity.userId,
  };
}
