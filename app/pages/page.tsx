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
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
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

function NavIcon({ tab }: { tab: TabId }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-[18px] w-[18px]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (tab === 'resume') {
    return (
      <svg {...common}>
        <path d="M8 3h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v4h4" />
        <path d="M9.5 12h5" />
        <path d="M9.5 15.5h5" />
        <path d="M9.5 19h3" />
      </svg>
    );
  }

  if (tab === 'interview') {
    return (
      <svg {...common}>
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H12l-3.5 3.5V15H7.5A2.5 2.5 0 0 1 5 12.5v-6z" />
        <path d="M9.5 8.5h5" />
        <path d="M9.5 11.5h3.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M8 7.5 5.5 12 8 16.5" />
      <path d="M16 7.5 18.5 12 16 16.5" />
      <path d="M13.2 6.5 10.8 17.5" />
    </svg>
  );
}

function WorkspaceShell() {
  const { t } = useAppLanguage();
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromSearch(searchParams.get('tab'))
  );
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  useEffect(() => {
    setActiveTab(tabFromSearch(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (!configured || loading || user) return;
    const next = `/pages${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [configured, loading, user, router, searchParams]);

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

  const navItems: { id: TabId; label: string }[] = [
    { id: 'resume', label: t.resumeTitle },
    { id: 'interview', label: t.prepTitle },
    { id: 'practice', label: t.practiceTitle },
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

  if (configured && (loading || !user)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--shell-bg)] text-sm text-[var(--shell-muted)]">
        {t.loading}
      </div>
    );
  }

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
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--shell-tab-active)] text-[var(--shell-tab-active-text)] transition hover:opacity-90"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M8 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
            <path d="M3 13h18" />
            <path d="M12 12v2" />
          </svg>
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
              className={`flex h-[3.5rem] w-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition ${
                active
                  ? 'bg-[var(--shell-tab-active)] text-[var(--shell-tab-active-text)] shadow-sm'
                  : 'text-[var(--shell-muted)] hover:bg-[var(--shell-hover)] hover:text-[var(--foreground)]'
              }`}
            >
              <NavIcon tab={item.id} />
              <span className="max-w-[52px] truncate leading-tight opacity-90">
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

      <div className="relative flex min-w-0 flex-1 print:block">
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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shell-header print:hidden relative z-40 shrink-0">
            <div className="relative z-10 mx-auto max-w-4xl px-4 py-3 pr-40 md:px-8 sm:pr-52">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/75">
                {t.brand}
              </p>
              <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                {title}
              </h1>
              <p className="mt-0.5 hidden truncate py-[5px] text-sm text-white/80 sm:block">
                {subtitle}
              </p>
            </div>
            <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2 sm:right-6">
              <HeaderControls />
            </div>
          </header>

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
