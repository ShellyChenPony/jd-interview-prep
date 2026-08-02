export type AppEnv = 'dev' | 'prod';

/**
 * Resolve runtime environment for history isolation.
 * Priority:
 * 1. APP_ENV / NEXT_PUBLIC_APP_ENV = dev|prod|development|production
 * 2. Vercel: VERCEL_ENV === 'production' → prod
 * 3. NODE_ENV === 'production' → prod, else dev
 */
export function getAppEnv(): AppEnv {
  const explicit =
    process.env.APP_ENV?.trim() || process.env.NEXT_PUBLIC_APP_ENV?.trim();

  if (explicit === 'prod' || explicit === 'production') return 'prod';
  if (explicit === 'dev' || explicit === 'development') return 'dev';

  if (process.env.VERCEL_ENV === 'production') return 'prod';

  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}
