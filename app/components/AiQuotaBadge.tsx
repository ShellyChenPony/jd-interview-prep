'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AI_QUOTA_CHANGED_EVENT,
  aiRequestHeaders,
} from '@/lib/ai-request-headers';
import type { AiFeature, AiQuotaSnapshot } from '@/lib/ai-quota-types';
import { useAppLanguage } from '@/lib/app-language';

const FEATURE_LABEL_KEY: Record<
  AiFeature,
  | 'quotaFeatFormat'
  | 'quotaFeatGenerate'
  | 'quotaFeatMatch'
  | 'quotaFeatCover'
  | 'quotaFeatPractice'
  | 'quotaFeatMarkers'
  | 'quotaFeatAnalyzeTpl'
> = {
  'format-resume': 'quotaFeatFormat',
  generate: 'quotaFeatGenerate',
  'jd-match': 'quotaFeatMatch',
  'cover-letter': 'quotaFeatCover',
  'practice-recommend': 'quotaFeatPractice',
  'resume-interview': 'quotaFeatMarkers',
  'analyze-resume-template': 'quotaFeatAnalyzeTpl',
};

export default function AiQuotaBadge() {
  const { t } = useAppLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<AiQuotaSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-quota', {
        headers: aiRequestHeaders(),
        cache: 'no-store',
      });
      const data = (await res.json()) as AiQuotaSnapshot & { error?: string };
      if (!res.ok) {
        setError(data.error || t.quotaLoadFail);
        return;
      }
      setSnapshot(data);
      setError(null);
    } catch {
      setError(t.quotaLoadFail);
    }
  }, [t.quotaLoadFail]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener(AI_QUOTA_CHANGED_EVENT, onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(AI_QUOTA_CHANGED_EVENT, onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [load]);

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

  if (error && !snapshot) {
    return null;
  }

  if (!snapshot) {
    return (
      <div className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-card)] px-3 py-1.5 text-xs text-[var(--shell-muted)]">
        {t.quotaLoading}
      </div>
    );
  }

  const exhausted = snapshot.features.filter((f) => f.remaining <= 0);
  const low = snapshot.features.filter(
    (f) => f.remaining > 0 && f.remaining <= 1
  );
  const warn = exhausted.length > 0 || low.length > 0 || snapshot.totalRemaining <= 5;

  return (
    <div ref={rootRef} className="relative print:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition ${
          exhausted.length > 0
            ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100'
            : warn
              ? 'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-100'
              : 'border-[var(--shell-border)] bg-[var(--shell-card)] text-[var(--foreground)]'
        }`}
        aria-expanded={open}
        title={t.quotaHint}
      >
        {t.quotaRemainingToday
          .replace('{remaining}', String(snapshot.totalRemaining))
          .replace('{limit}', String(snapshot.totalLimit))}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-card)] p-3 shadow-lg">
          <p className="text-xs font-semibold text-[var(--foreground)]">{t.quotaTitle}</p>
          <p className="mt-1 text-[11px] text-[var(--shell-muted)]">{t.quotaHint}</p>
          {warn && (
            <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
              {exhausted.length > 0
                ? t.quotaExhaustedHint
                : t.quotaLowHint}
            </p>
          )}
          <ul className="mt-3 space-y-1.5">
            {snapshot.features.map((f) => (
              <li
                key={f.feature}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-[var(--shell-muted)]">
                  {t[FEATURE_LABEL_KEY[f.feature]]}
                </span>
                <span
                  className={`tabular-nums font-medium ${
                    f.remaining <= 0
                      ? 'text-amber-700 dark:text-amber-300'
                      : f.remaining <= 1
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-[var(--foreground)]'
                  }`}
                >
                  {f.remaining}/{f.limit}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--shell-subtle)]">
            {t.quotaResetsUtc} · {snapshot.day}
          </p>
        </div>
      )}
    </div>
  );
}
