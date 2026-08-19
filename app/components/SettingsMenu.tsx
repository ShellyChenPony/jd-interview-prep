'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import { useAppTheme, type AppTheme } from '@/lib/app-theme';
import { RESUME_LANGUAGES, type ResumeLanguageCode } from '@/lib/resume-languages';

type SettingsMenuProps = {
  /** rail: icon-only in left nav; header: text+icon (unused now) */
  variant?: 'rail' | 'header';
};

export default function SettingsMenu({ variant = 'header' }: SettingsMenuProps) {
  const { language, setLanguage, t } = useAppLanguage();
  const { theme, setTheme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isRail = variant === 'rail';

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isRail
            ? 'flex h-10 w-10 items-center justify-center rounded-full text-[var(--shell-muted)] transition hover:bg-[var(--shell-hover)] hover:text-[var(--foreground)]'
            : 'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-muted)] transition hover:bg-[var(--shell-hover)] hover:text-[var(--foreground)]'
        }
        aria-expanded={open}
        aria-label={t.settings}
        title={t.settings}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={isRail ? 'h-5 w-5' : 'h-4 w-4'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {!isRail ? <span className="hidden sm:inline">{t.settings}</span> : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-50 w-64 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-card)] p-3 shadow-lg ${
            isRail
              ? 'bottom-0 left-full ml-2'
              : 'right-0 top-full mt-2'
          }`}
        >
          <label className="block text-xs font-medium text-[var(--shell-muted)]">
            {t.language}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as ResumeLanguageCode)}
              className="mt-1.5 w-full rounded-lg border border-[var(--shell-border)] bg-[var(--shell-bg)] px-2.5 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              aria-label={t.language}
            >
              {RESUME_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-xs font-medium text-[var(--shell-muted)]">
            {t.theme}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
              className="mt-1.5 w-full rounded-lg border border-[var(--shell-border)] bg-[var(--shell-bg)] px-2.5 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              aria-label={t.theme}
            >
              <option value="light">{t.themeLight}</option>
              <option value="dark">{t.themeDark}</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
