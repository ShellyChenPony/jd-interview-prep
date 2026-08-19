'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import { useAuth } from '@/lib/auth/auth-context';

type AccountMenuProps = {
  /** shell: workspace header; home: marketing header; rail: left-nav avatar only */
  variant?: 'shell' | 'home' | 'rail';
};

export default function AccountMenu({ variant = 'shell' }: AccountMenuProps) {
  const { t } = useAppLanguage();
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isRail = variant === 'rail';
  const isShell = variant === 'shell';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!configured) {
    return null;
  }

  // Left rail only shows avatar after login (sign-in stays top-right).
  if (isRail && (loading || !user)) {
    return null;
  }

  const shellBtn =
    'rounded-full border border-[var(--shell-border)] bg-[var(--shell-card)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] shadow-sm hover:opacity-90';
  const homeBtn =
    'rounded-xl border border-[#c5d4e0] bg-white/80 px-3 py-1.5 text-sm font-medium text-[#0f2744] backdrop-blur hover:bg-white';

  const onSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError(t.authSignInError);
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      setOpen(false);
    } catch {
      setError(t.authSignOutError);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        className={
          variant === 'home'
            ? 'px-3 py-1.5 text-sm text-[#3d5163]'
            : 'px-3 py-1.5 text-sm text-[var(--shell-muted)]'
        }
      >
        {t.authLoading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => void onSignIn()}
          disabled={busy}
          className={`${variant === 'home' ? homeBtn : shellBtn} disabled:opacity-50`}
        >
          {busy ? t.authSigningIn : t.authSignInGoogle}
        </button>
        {error ? (
          <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const displayName = user.fullName || user.email || t.authAccount;
  const initial = (displayName.trim().charAt(0) || 'U').toUpperCase();
  const headerName = user.fullName || t.authAccount;

  const avatarImg = user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatarUrl}
      alt=""
      className={
        isRail
          ? 'h-10 w-10 rounded-full object-cover'
          : isShell
            ? 'h-8 w-8 rounded-full object-cover'
            : 'h-6 w-6 rounded-full object-cover'
      }
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      className={`flex items-center justify-center rounded-full font-bold ${
        isRail
          ? 'h-10 w-10 text-sm bg-[var(--shell-accent-btn)] text-[var(--shell-accent-btn-text)]'
          : isShell
            ? 'h-8 w-8 text-xs bg-[var(--shell-accent-btn)] text-[var(--shell-accent-btn-text)]'
            : variant === 'home'
              ? 'h-6 w-6 text-[11px] bg-[#0f2744] text-white'
              : 'h-6 w-6 text-[11px] bg-[var(--shell-accent-btn)] text-[var(--shell-accent-btn-text)]'
      }`}
    >
      {initial}
    </span>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isRail
            ? 'flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--shell-border)] transition hover:opacity-90'
            : isShell
              ? 'inline-flex max-w-[min(100vw-8rem,22rem)] items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-[var(--shell-hover)]'
              : `flex items-center gap-2 ${homeBtn}`
        }
        aria-expanded={open}
        aria-label={displayName}
        title={displayName}
      >
        {avatarImg}
        {isShell ? (
          <>
            <span className="hidden min-w-0 flex-1 sm:block">
              <span className="block truncate text-sm text-[var(--foreground)]">
                {headerName}
              </span>
            </span>
            <span className="hidden shrink-0 rounded-md bg-[var(--shell-bg)] px-1.5 py-0.5 text-[11px] text-[var(--shell-muted)] sm:inline">
              {t.authMemberBadge}
            </span>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="hidden h-3.5 w-3.5 shrink-0 text-[var(--shell-muted)] sm:block"
              fill="currentColor"
            >
              <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
            </svg>
          </>
        ) : !isRail ? (
          <span className="hidden max-w-[9rem] truncate sm:inline">{displayName}</span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-50 w-56 rounded-xl border p-3 shadow-lg ${
            isRail
              ? 'bottom-full left-0 mb-2 border-[var(--shell-border)] bg-[var(--shell-card)] text-[var(--foreground)]'
              : variant === 'home'
                ? 'right-0 top-full mt-2 border-[#c5d4e0] bg-white text-[#0f2744]'
                : 'right-0 top-full mt-2 border-[var(--shell-border)] bg-[var(--shell-card)] text-[var(--foreground)]'
          }`}
        >
          <p className="truncate text-sm font-medium">{displayName}</p>
          {user.email ? (
            <p
              className={`mt-0.5 truncate text-xs ${
                variant === 'home' ? 'text-[#3d5163]' : 'text-[var(--shell-muted)]'
              }`}
            >
              {user.email}
            </p>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => void onSignOut()}
            disabled={busy}
            className={`mt-3 w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:opacity-90 disabled:opacity-50 ${
              variant === 'home' ? 'bg-[#edf3f7]' : 'bg-[var(--shell-bg)]'
            }`}
          >
            {busy ? t.authSigningOut : t.authSignOut}
          </button>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
