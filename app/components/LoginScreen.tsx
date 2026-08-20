'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import { useAuth } from '@/lib/auth/auth-context';

function safeNextPath(raw: string | null): string {
  if (!raw) return '/pages';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return '/pages';
}

function LoginScreenInner() {
  const { t } = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, configured, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  const onGoogle = async () => {
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(next);
    } catch {
      setError(t.authSignInError);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#edf3f7] px-5 py-12 text-[#0f2744]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,#c5e4e0_0%,transparent_55%),linear-gradient(180deg,#e8f1f6_0%,#edf3f7_50%,#f5f8fa_100%)]" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[#c5d4e0] bg-white/90 p-7 shadow-[0_24px_60px_-28px_rgba(15,39,68,0.35)] backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B27D7B]">
          {t.brand}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.loginTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#3d5163]">{t.loginSub}</p>

        {loading ? (
          <p className="mt-8 text-sm text-[#3d5163]">{t.authLoading}</p>
        ) : !configured ? (
          <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            {t.loginUnavailable}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void onGoogle()}
            disabled={busy || Boolean(user)}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-[#c5d4e0] bg-white px-4 py-3 text-sm font-semibold text-[#0f2744] shadow-sm transition hover:bg-[#f7fafc] disabled:opacity-60"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
              />
              <path
                fill="#34A853"
                d="M6.6 14.3l-.8.6-2.5 2c1.6 3.1 4.9 5.2 8.7 5.2 2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4z"
              />
              <path
                fill="#4A90E2"
                d="M3.3 7.1C2.5 8.6 2 10.2 2 12s.5 3.4 1.3 4.9l3.3-2.6c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.3 7.1z"
              />
              <path
                fill="#FBBC05"
                d="M12 5.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.7 14.6 1.9 12 1.9 8.2 1.9 4.9 4 3.3 7.1l3.3 2.6C7.3 7.6 9.5 5.9 12 5.9z"
              />
            </svg>
            {busy ? t.authSigningIn : t.loginContinue}
          </button>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-[#B27D7B] underline-offset-2 hover:underline"
        >
          {t.loginBackHome}
        </Link>
      </div>
    </div>
  );
}

export default function LoginScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#edf3f7] text-sm text-[#3d5163]">
          Loading…
        </div>
      }
    >
      <LoginScreenInner />
    </Suspense>
  );
}
