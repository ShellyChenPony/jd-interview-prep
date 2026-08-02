'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import InterviewPrep from '@/app/components/InterviewPrep';
import PrepHistoryPanel from '@/app/components/PrepHistoryPanel';
import ResumeHistoryPanel from '@/app/components/ResumeHistoryPanel';
import ResumeTemplate from '@/app/components/ResumeTemplate';
import { AppLanguageProvider, useAppLanguage } from '@/lib/app-language';
import { AppThemeProvider, useAppTheme, type AppTheme } from '@/lib/app-theme';
import { RESUME_LANGUAGES, type ResumeLanguageCode } from '@/lib/resume-languages';

type TabId = 'resume' | 'interview';

function tabFromSearch(value: string | null): TabId {
  return value === 'interview' || value === 'prep' ? 'interview' : 'resume';
}

function HeaderControls() {
  const { language, setLanguage, t } = useAppLanguage();
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
        <span className="hidden sm:inline whitespace-nowrap">{t.language}</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as ResumeLanguageCode)}
          className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-card)] px-3 py-1.5 text-sm text-[var(--foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
          aria-label={t.language}
        >
          {RESUME_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
        <span className="hidden sm:inline whitespace-nowrap">{t.theme}</span>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as AppTheme)}
          className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-card)] px-3 py-1.5 text-sm text-[var(--foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
          aria-label={t.theme}
        >
          <option value="light">{t.themeLight}</option>
          <option value="dark">{t.themeDark}</option>
        </select>
      </label>
    </div>
  );
}

function HomeShell() {
  const { t } = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromSearch(searchParams.get('tab'))
  );
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  useEffect(() => {
    setActiveTab(tabFromSearch(searchParams.get('tab')));
  }, [searchParams]);

  const [resumeHistoryId, setResumeHistoryId] = useState<string | null>(null);
  const [resumeHistoryRefreshKey, setResumeHistoryRefreshKey] = useState(0);
  const [resumeResetKey, setResumeResetKey] = useState(0);

  const [prepHistoryId, setPrepHistoryId] = useState<string | null>(null);
  const [prepHistoryRefreshKey, setPrepHistoryRefreshKey] = useState(0);
  const [prepResetKey, setPrepResetKey] = useState(0);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobileHistoryOpen(false);
    router.replace(`/pages?tab=${tab}`, { scroll: false });
  };

  const navItems: { id: TabId; label: string; short: string }[] = [
    { id: 'resume', label: t.resumeTitle, short: 'CV' },
    { id: 'interview', label: t.prepTitle, short: 'Q' },
  ];

  return (
    <div className="h-dvh overflow-hidden bg-[var(--shell-bg)] text-[var(--foreground)] print:h-auto print:overflow-visible print:bg-white">
      <div className="flex h-full print:block">
        <nav
          aria-label="Main"
          className="print:hidden z-30 flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-[var(--shell-border)] bg-[var(--shell-rail)] py-4"
        >
          <Link
            href="/"
            title={t.brand}
            aria-label={`${t.brand} — home`}
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--shell-accent-btn)] text-xs font-bold text-[var(--shell-accent-btn-text)] transition hover:opacity-90"
          >
            AI
          </Link>
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => selectTab(item.id)}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-[10px] font-semibold transition ${
                  active
                    ? 'bg-[var(--shell-active)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--shell-muted)] hover:bg-[var(--shell-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="text-sm font-bold tracking-tight">{item.short}</span>
                <span className="mt-0.5 max-w-[52px] truncate opacity-80">
                  {item.id === 'resume' ? t.resumeNav : t.prepNav}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="mt-auto md:hidden flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--shell-card)] text-xs font-semibold text-[var(--foreground)] shadow-sm border border-[var(--shell-border)]"
            onClick={() => setMobileHistoryOpen((v) => !v)}
            aria-label={t.list}
          >
            {t.list}
          </button>
        </nav>

        <aside
          className={`print:hidden z-20 w-[300px] shrink-0 border-r border-[var(--shell-border)] bg-[var(--shell-panel)] ${
            mobileHistoryOpen
              ? 'absolute inset-y-0 left-[72px] block shadow-xl md:static md:shadow-none'
              : 'hidden md:block'
          }`}
        >
          {activeTab === 'resume' ? (
            <ResumeHistoryPanel
              selectedId={resumeHistoryId}
              refreshKey={resumeHistoryRefreshKey}
              onSelect={(id) => {
                setResumeHistoryId(id);
                setMobileHistoryOpen(false);
              }}
              onNew={() => {
                setResumeHistoryId(null);
                setResumeResetKey((n) => n + 1);
                setMobileHistoryOpen(false);
              }}
            />
          ) : (
            <PrepHistoryPanel
              selectedId={prepHistoryId}
              refreshKey={prepHistoryRefreshKey}
              onSelect={(id) => {
                setPrepHistoryId(id);
                setMobileHistoryOpen(false);
              }}
              onNew={() => {
                setPrepHistoryId(null);
                setPrepResetKey((n) => n + 1);
                setMobileHistoryOpen(false);
              }}
            />
          )}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--shell-main)] print:overflow-visible print:bg-white">
          <div className="app-workspace mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
            <header className="mb-6 print:hidden flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--shell-subtle)]">
                  {t.brand}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {activeTab === 'resume' ? t.resumeTitle : t.prepTitle}
                </h1>
                <p className="mt-1 text-sm text-[var(--shell-muted)]">
                  {activeTab === 'resume' ? t.resumeSubtitle : t.prepSubtitle}
                </p>
              </div>
              <HeaderControls />
            </header>

            {activeTab === 'resume' ? (
              <ResumeTemplate
                activeHistoryId={resumeHistoryId}
                resetKey={resumeResetKey}
                onHistorySaved={(id) => {
                  setResumeHistoryId(id);
                  setResumeHistoryRefreshKey((n) => n + 1);
                }}
              />
            ) : (
              <InterviewPrep
                activeHistoryId={prepHistoryId}
                resetKey={prepResetKey}
                onHistorySaved={(id) => {
                  setPrepHistoryId(id);
                  setPrepHistoryRefreshKey((n) => n + 1);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <AppThemeProvider>
      <AppLanguageProvider>
        <Suspense
          fallback={
            <div className="flex h-dvh items-center justify-center bg-[var(--shell-bg)] text-sm text-[var(--shell-muted)]">
              Loading…
            </div>
          }
        >
          <HomeShell />
        </Suspense>
      </AppLanguageProvider>
    </AppThemeProvider>
  );
}
