'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { aiRequestHeaders } from '@/lib/ai-request-headers';
import { useAppLanguage } from '@/lib/app-language';

type FeedbackCategory = 'general' | 'bug' | 'idea' | 'other';

const SUPPORT_EMAIL =
  typeof process.env.NEXT_PUBLIC_SUPPORT_EMAIL === 'string'
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL.trim()
    : '';

export default function FeedbackWidget() {
  const { t } = useAppLanguage();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [supportCopied, setSupportCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
      if (success) {
        setCategory('general');
        setMessage('');
        setContactEmail('');
        setError(null);
        setSuccess(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (success) {
          setCategory('general');
          setMessage('');
          setContactEmail('');
          setError(null);
          setSuccess(false);
        }
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, success]);

  const resetForm = () => {
    setCategory('general');
    setMessage('');
    setContactEmail('');
    setError(null);
    setSuccess(false);
  };

  const close = () => {
    setOpen(false);
    if (success) resetForm();
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          ...aiRequestHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          category,
          contactEmail: contactEmail.trim() || undefined,
          pagePath:
            typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t.feedbackError);
        return;
      }
      setSuccess(true);
      setMessage('');
      setContactEmail('');
      setCategory('general');
    } catch {
      setError(t.feedbackError);
    } finally {
      setSubmitting(false);
    }
  };

  const categories: { id: FeedbackCategory; label: string }[] = [
    { id: 'general', label: t.feedbackCatGeneral },
    { id: 'bug', label: t.feedbackCatBug },
    { id: 'idea', label: t.feedbackCatIdea },
    { id: 'other', label: t.feedbackCatOther },
  ];

  const contactSupport = async () => {
    if (!SUPPORT_EMAIL) return;
    setSupportCopied(false);
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setSupportCopied(true);
      window.setTimeout(() => setSupportCopied(false), 2500);
    } catch {
      // clipboard may be blocked; still try mailto
    }
    // mailto alone often looks like "no effect" when no mail app is set
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      'AI Remote Job Prep support'
    )}`;
  };

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden"
    >
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto w-[min(100vw-2.5rem,22rem)] rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-card)] p-4 shadow-[0_18px_50px_-28px_rgba(15,39,68,0.55)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={titleId}
                className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--foreground)]"
              >
                {t.feedbackTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--shell-muted)]">
                {t.feedbackHint}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full px-2 py-1 text-xs text-[var(--shell-muted)] hover:bg-[var(--shell-bg)] hover:text-[var(--foreground)]"
              aria-label={t.feedbackClose}
            >
              ✕
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-bg)] px-3 py-2.5">
            <p className="text-xs leading-relaxed text-[var(--shell-muted)]">
              {t.feedbackSupportHint}
            </p>
            {SUPPORT_EMAIL ? (
              <div className="mt-2 flex flex-col items-start gap-1">
                <button
                  type="button"
                  onClick={() => void contactSupport()}
                  className="text-xs font-medium text-[var(--foreground)] underline underline-offset-2 hover:opacity-80"
                >
                  {t.feedbackSupportLink}
                </button>
                <p className="break-all text-[11px] text-[var(--shell-muted)]">
                  {SUPPORT_EMAIL}
                </p>
                {supportCopied ? (
                  <p className="text-[11px] font-medium text-[var(--foreground)]">
                    {t.feedbackSupportCopied}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {success ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--foreground)]">{t.feedbackSuccess}</p>
              <button
                type="button"
                onClick={close}
                className="rounded-full bg-[var(--shell-accent-btn)] px-3.5 py-1.5 text-xs font-medium text-[var(--shell-accent-btn-text)] hover:opacity-90"
              >
                {t.feedbackClose}
              </button>
            </div>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--shell-muted)]">
                  {t.feedbackCategory}
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        category === item.id
                          ? 'border-[var(--shell-accent-btn)] bg-[var(--shell-accent-btn)] text-[var(--shell-accent-btn-text)]'
                          : 'border-[var(--shell-border)] text-[var(--shell-muted)] hover:border-[var(--shell-accent-btn)]/40 hover:text-[var(--foreground)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="text-[11px] font-medium uppercase tracking-wide text-[var(--shell-muted)]"
                >
                  {t.feedbackMessage}
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  maxLength={4000}
                  required
                  placeholder={t.feedbackMessagePlaceholder}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[var(--shell-border)] bg-[var(--shell-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--shell-muted)] focus:border-[var(--shell-accent-btn)]"
                />
              </div>

              <div>
                <label
                  htmlFor="feedback-email"
                  className="text-[11px] font-medium uppercase tracking-wide text-[var(--shell-muted)]"
                >
                  {t.feedbackEmail}
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder={t.feedbackEmailPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-[var(--shell-border)] bg-[var(--shell-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--shell-muted)] focus:border-[var(--shell-accent-btn)]"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="rounded-full bg-[var(--shell-accent-btn)] px-3.5 py-1.5 text-xs font-medium text-[var(--shell-accent-btn-text)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t.feedbackSubmitting : t.feedbackSubmit}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setError(null);
          setSuccess(false);
          setOpen(true);
        }}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-card)] px-4 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_30px_-18px_rgba(15,39,68,0.55)] transition hover:border-[var(--shell-accent-btn)]/40 hover:opacity-95"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
      >
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--shell-accent-btn)] text-[11px] font-bold text-[var(--shell-accent-btn-text)]"
        >
          ?
        </span>
        {t.feedbackOpen}
      </button>
    </div>
  );
}
