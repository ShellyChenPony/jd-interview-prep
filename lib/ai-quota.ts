import { createHash } from 'crypto';
import {
  AI_FEATURES,
  type AiFeature,
  type AiQuotaFeatureStatus,
  type AiQuotaSnapshot,
} from '@/lib/ai-quota-types';
import { getAppEnv } from '@/lib/app-env';
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server';

export type { AiFeature, AiQuotaFeatureStatus, AiQuotaSnapshot } from '@/lib/ai-quota-types';
export { AI_FEATURES } from '@/lib/ai-quota-types';

/** Per-device daily defaults (override with AI_QUOTA_<FEATURE>_DEVICE). */
const DEVICE_LIMITS: Record<AiFeature, number> = {
  'format-resume': 5,
  generate: 3,
  'jd-match': 3,
  'cover-letter': 3,
  'practice-recommend': 5,
  'resume-interview': 5,
  'analyze-resume-template': 5,
};

/** In-memory fallback when Supabase is not configured (per server instance). */
const memoryCounts = new Map<string, number>();

export function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function memoryKey(
  day: string,
  env: string,
  feature: AiFeature,
  subjectType: 'device' | 'ip',
  subjectKey: string
): string {
  return `${day}|${env}|${feature}|${subjectType}|${subjectKey}`;
}

async function getSubjectCount(
  feature: AiFeature,
  subjectType: 'device' | 'ip',
  subjectKey: string
): Promise<number> {
  const day = utcDay();
  const env = getAppEnv();

  if (!isSupabaseConfigured()) {
    return memoryCounts.get(memoryKey(day, env, feature, subjectType, subjectKey)) ?? 0;
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('ai_usage_daily')
    .select('count')
    .eq('day', day)
    .eq('env', env)
    .eq('feature', feature)
    .eq('subject_type', subjectType)
    .eq('subject_key', subjectKey)
    .maybeSingle();

  if (error) {
    console.error('[ai-quota] read failed', error);
    return memoryCounts.get(memoryKey(day, env, feature, subjectType, subjectKey)) ?? 0;
  }

  return typeof data?.count === 'number' ? data.count : 0;
}

/** Read-only device quota snapshot (does not consume). */
export async function getDeviceQuotaSnapshot(
  deviceId: string
): Promise<AiQuotaSnapshot> {
  const day = utcDay();
  const env = getAppEnv();
  const features: AiQuotaFeatureStatus[] = [];

  for (const feature of AI_FEATURES) {
    const limit = deviceLimit(feature);
    const rawUsed = await getSubjectCount(feature, 'device', deviceId);
    const remaining = Math.max(0, limit - rawUsed);
    features.push({
      feature,
      used: Math.min(rawUsed, limit),
      limit,
      remaining,
    });
  }

  const totalUsed = features.reduce((s, f) => s + f.used, 0);
  const totalLimit = features.reduce((s, f) => s + f.limit, 0);
  const totalRemaining = features.reduce((s, f) => s + f.remaining, 0);

  return {
    day,
    env,
    features,
    totalUsed,
    totalLimit,
    totalRemaining,
  };
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function featureEnvKey(feature: AiFeature): string {
  return feature.replace(/-/g, '_').toUpperCase();
}

export function deviceLimit(feature: AiFeature): number {
  return envInt(
    `AI_QUOTA_${featureEnvKey(feature)}_DEVICE`,
    envInt('AI_QUOTA_DEVICE_DAILY', DEVICE_LIMITS[feature])
  );
}

export function ipLimit(feature: AiFeature): number {
  const device = deviceLimit(feature);
  return envInt(
    `AI_QUOTA_${featureEnvKey(feature)}_IP`,
    envInt('AI_QUOTA_IP_DAILY', Math.max(device * 3, device))
  );
}

export function deviceIdFromRequest(req: Request): string | null {
  const id = req.headers.get('x-device-id')?.trim();
  return id || null;
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

export function hashIp(ip: string): string {
  const salt =
    process.env.AI_QUOTA_IP_SALT?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()?.slice(0, 32) ||
    'ai-quota-dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

type ConsumeResult =
  | { ok: true; deviceCount: number; ipCount: number; deviceLimit: number; ipLimit: number }
  | {
      ok: false;
      reason: 'missing_device' | 'device_limit' | 'ip_limit';
      deviceCount: number;
      ipCount: number;
      deviceLimit: number;
      ipLimit: number;
      message: string;
    };

async function incrementSubject(
  feature: AiFeature,
  subjectType: 'device' | 'ip',
  subjectKey: string
): Promise<number> {
  const day = utcDay();
  const env = getAppEnv();

  if (!isSupabaseConfigured()) {
    const key = memoryKey(day, env, feature, subjectType, subjectKey);
    const next = (memoryCounts.get(key) ?? 0) + 1;
    memoryCounts.set(key, next);
    return next;
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase.rpc('increment_ai_usage', {
    p_day: day,
    p_env: env,
    p_feature: feature,
    p_subject_type: subjectType,
    p_subject_key: subjectKey,
  });

  if (error) {
    console.error('[ai-quota] rpc failed, falling back to memory', error);
    const key = memoryKey(day, env, feature, subjectType, subjectKey);
    const next = (memoryCounts.get(key) ?? 0) + 1;
    memoryCounts.set(key, next);
    return next;
  }

  return typeof data === 'number' ? data : Number(data) || 0;
}

/**
 * Atomically consume one unit for device + IP.
 * Call once at the start of each billable AI route.
 */
export async function consumeAiQuota(
  req: Request,
  feature: AiFeature
): Promise<ConsumeResult> {
  const dLimit = deviceLimit(feature);
  const iLimit = ipLimit(feature);
  const deviceId = deviceIdFromRequest(req);
  const ipHash = hashIp(clientIpFromRequest(req));

  if (!deviceId) {
    return {
      ok: false,
      reason: 'missing_device',
      deviceCount: 0,
      ipCount: 0,
      deviceLimit: dLimit,
      ipLimit: iLimit,
      message: 'Missing device id. Refresh the page and try again.',
    };
  }

  // Soft-disable: limit 0 means feature blocked for promo pause.
  if (dLimit <= 0) {
    return {
      ok: false,
      reason: 'device_limit',
      deviceCount: 0,
      ipCount: 0,
      deviceLimit: dLimit,
      ipLimit: iLimit,
      message: 'This AI feature is temporarily unavailable.',
    };
  }

  const deviceCount = await incrementSubject(feature, 'device', deviceId);
  if (deviceCount > dLimit) {
    return {
      ok: false,
      reason: 'device_limit',
      deviceCount,
      ipCount: 0,
      deviceLimit: dLimit,
      ipLimit: iLimit,
      message: `Daily free limit reached for this feature (${dLimit}/day on this device). Try again tomorrow.`,
    };
  }

  const ipCount = await incrementSubject(feature, 'ip', ipHash);
  if (ipCount > iLimit) {
    return {
      ok: false,
      reason: 'ip_limit',
      deviceCount,
      ipCount,
      deviceLimit: dLimit,
      ipLimit: iLimit,
      message: `Daily free limit reached for this network (${iLimit}/day). Try again tomorrow.`,
    };
  }

  return {
    ok: true,
    deviceCount,
    ipCount,
    deviceLimit: dLimit,
    ipLimit: iLimit,
  };
}

/** Returns a 429/400 Response when over quota; otherwise null. */
export async function enforceAiQuota(
  req: Request,
  feature: AiFeature
): Promise<Response | null> {
  const result = await consumeAiQuota(req, feature);
  if (result.ok) {
    return null;
  }

  const status = result.reason === 'missing_device' ? 400 : 429;
  // Plain text body so useObject / fetch error.message stays readable.
  return new Response(result.message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-RateLimit-Limit-Device': String(result.deviceLimit),
      'X-RateLimit-Limit-IP': String(result.ipLimit),
      'X-RateLimit-Remaining-Device': String(
        Math.max(0, result.deviceLimit - result.deviceCount)
      ),
      'X-AI-Quota-Feature': feature,
      'X-AI-Quota-Code': result.reason,
    },
  });
}
