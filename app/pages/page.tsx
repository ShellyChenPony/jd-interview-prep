'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AiQuotaBadge from '@/app/components/AiQuotaBadge';
import AccountMenu from '@/app/components/AccountMenu';
import SettingsMenu from '@/app/components/SettingsMenu';
import FeedbackWidget from '@/app/components/FeedbackWidget';
import InterviewPrep from '@/app/components/InterviewPrep';
import PracticeBoard from '@/app/components/PracticeBoard';
import PracticeSidePanel from '@/app/components/PracticeSidePanel';
import PrepHistoryPanel from '@/app/components/PrepHistoryPanel';
import ResumeHistoryPanel from '@/app/components/ResumeHistoryPanel';
import ResumeTemplate from '@/app/components/ResumeTemplate';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AppLanguageProvider, useAppLanguage } from '@/lib/app-language';
import { AppThemeProvider } from '@/lib/app-theme';
import type { JobCategoryId } from '@/lib/leetcode-catalog';

type TabId = 'resume' | 'interview' | 'practice';

function tabFromSearch(value: string | null): TabId {
  if (value === 'interview' || value === 'prep') return 'interview';
  if (value === 'practice' || value === 'drill' || value === 'leetcode') {
    return 'practice';
  }
  return 'resume';
}

function HeaderControls() {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
      <AiQuotaBadge />
      <AccountMenu />
    </div>
  );
}

function navLabel(tab: TabId, t: ReturnType<typeof useAppLanguage>['t']): string {
  if (tab === 'resume') return t.resumeNav;
  if (tab === 'interview') return t.prepNav;
  return t.practiceNav;
}

function WorkspaceShell() {
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

  const [prepHistoryId, setPrepHistoryId] = useState<string | null>(null);
  const [prepHistoryRefreshKey, setPrepHistoryRefreshKey] = useState(0);

  const [practiceCategoryId, setPracticeCategoryId] =
    useState<JobCategoryId>('frontend');
  const [practiceHistoryId, setPracticeHistoryId] = useState<string | null>(null);
  const [practiceHistoryRefreshKey, setPracticeHistoryRefreshKey] = useState(0);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobileHistoryOpen(false);
    router.replace(`/pages?tab=${tab}`, { scroll: false });
  };

  const navItems: { id: TabId; label: string; short: string }[] = [
    { id: 'resume', label: t.resumeTitle, short: 'CV' },
    { id: 'interview', label: t.prepTitle, short: 'Q' },
    { id: 'practice', label: t.practiceTitle, short: 'LC' },
  ];

  const title =
    activeTab === 'resume'
      ? t.resumeTitle
      : activeTab === 'interview'
        ? t.prepTitle
        : t.practiceTitle;
  const subtitle =
    activeTab === 'resume'
      ? t.resumeSubtitle
      : activeTab === 'interview'
        ? t.prepSubtitle
        : t.practiceSubtitle;

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--shell-bg)] text-[var(--foreground)] print:h-auto print:overflow-visible print:bg-white">
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
                {navLabel(item.id, t)}
              </span>
            </button>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            type="button"
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-card)] text-xs font-semibold text-[var(--foreground)] shadow-sm"
            onClick={() => setMobileHistoryOpen((v) => !v)}
            aria-label={t.list}
          >
            {t.list}
          </button>
          <SettingsMenu variant="rail" />
          <AccountMenu variant="rail" />
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col print:block">
        <header className="print:hidden z-40 flex shrink-0 items-center justify-between gap-4 border-b border-[var(--shell-border)] bg-[var(--shell-card)] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--shell-subtle)]">
              {t.brand}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
              {title}
            </h1>
            <p className="mt-0.5 hidden truncate text-sm text-[var(--shell-muted)] sm:block">
              {subtitle}
            </p>
          </div>
          <HeaderControls />
        </header>

        <div className="relative flex min-h-0 flex-1 print:block">
          <aside
            className={`print:hidden z-20 w-[300px] shrink-0 border-r border-[var(--shell-border)] bg-[var(--shell-panel)] ${
              mobileHistoryOpen
                ? 'absolute inset-y-0 left-0 block shadow-xl md:static md:shadow-none'
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
              />
            ) : activeTab === 'interview' ? (
              <PrepHistoryPanel
                selectedId={prepHistoryId}
                refreshKey={prepHistoryRefreshKey}
                onSelect={(id) => {
                  setPrepHistoryId(id);
                  setMobileHistoryOpen(false);
                }}
              />
            ) : (
              <PracticeSidePanel
                selectedCategoryId={practiceCategoryId}
                selectedHistoryId={practiceHistoryId}
                refreshKey={practiceHistoryRefreshKey}
                onSelectCategory={(id) => {
                  setPracticeCategoryId(id);
                  setPracticeHistoryId(null);
                  setMobileHistoryOpen(false);
                }}
                onSelectHistory={(id) => {
                  setPracticeHistoryId(id);
                  setMobileHistoryOpen(false);
                }}
              />
            )}
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--shell-main)] print:overflow-visible print:bg-white">
            <div className="app-workspace mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
              {activeTab === 'resume' ? (
                <ResumeTemplate
                  activeHistoryId={resumeHistoryId}
                  onHistorySaved={(id) => {
                    setResumeHistoryId(id);
                    setResumeHistoryRefreshKey((n) => n + 1);
                  }}
                />
              ) : activeTab === 'interview' ? (
                <InterviewPrep
                  activeHistoryId={prepHistoryId}
                  onHistorySaved={(id) => {
                    setPrepHistoryId(id);
                    setPrepHistoryRefreshKey((n) => n + 1);
                  }}
                />
              ) : (
                <PracticeBoard
                  selectedCategoryId={practiceCategoryId}
                  activeHistoryId={practiceHistoryId}
                  onCategoryChange={(id) => {
                    setPracticeCategoryId(id);
                    setPracticeHistoryId(null);
                  }}
                  onHistorySaved={(id) => {
                    setPracticeHistoryId(id);
                    setPracticeHistoryRefreshKey((n) => n + 1);
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      <FeedbackWidget />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <AppThemeProvider>
      <AppLanguageProvider>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex h-dvh items-center justify-center bg-[var(--shell-bg)] text-sm text-[var(--shell-muted)]">
                Loading…
              </div>
            }
          >
            <WorkspaceShell />
          </Suspense>
        </AuthProvider>
      </AppLanguageProvider>
    </AppThemeProvider>
  );
}
