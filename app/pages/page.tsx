'use client';

import { useState } from 'react';
import InterviewPrep from '@/app/components/InterviewPrep';
import PrepHistoryPanel from '@/app/components/PrepHistoryPanel';
import ResumeHistoryPanel from '@/app/components/ResumeHistoryPanel';
import ResumeTemplate from '@/app/components/ResumeTemplate';

type TabId = 'resume' | 'interview';

const navItems: {
  id: TabId;
  label: string;
  short: string;
}[] = [
  { id: 'resume', label: 'Resume Template', short: 'CV' },
  { id: 'interview', label: 'Interview Prep', short: 'Q' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('resume');
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const [resumeHistoryId, setResumeHistoryId] = useState<string | null>(null);
  const [resumeHistoryRefreshKey, setResumeHistoryRefreshKey] = useState(0);
  const [resumeResetKey, setResumeResetKey] = useState(0);

  const [prepHistoryId, setPrepHistoryId] = useState<string | null>(null);
  const [prepHistoryRefreshKey, setPrepHistoryRefreshKey] = useState(0);
  const [prepResetKey, setPrepResetKey] = useState(0);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobileHistoryOpen(false);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#f3f0eb] text-stone-900 print:h-auto print:overflow-visible print:bg-white">
      <div className="flex h-full print:block">
        {/* Left icon rail */}
        <nav
          aria-label="Main"
          className="print:hidden z-30 flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-stone-200/80 bg-[#efebe4] py-4"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-xs font-bold text-white">
            AI
          </div>
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
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-white/60 hover:text-stone-800'
                }`}
              >
                <span className="text-sm font-bold tracking-tight">{item.short}</span>
                <span className="mt-0.5 max-w-[52px] truncate opacity-80">
                  {item.id === 'resume' ? 'Resume' : 'Prep'}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="mt-auto md:hidden flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xs font-semibold text-stone-800 shadow-sm"
            onClick={() => setMobileHistoryOpen((v) => !v)}
            aria-label="Toggle history"
          >
            List
          </button>
        </nav>

        {/* Middle history column */}
        <aside
          className={`print:hidden z-20 w-[300px] shrink-0 border-r border-stone-200/80 bg-[#f7f4ef] ${
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

        {/* Right workspace */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#faf8f5] print:overflow-visible print:bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
            <header className="mb-6 print:hidden">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-400">
                AI Remote Job Prep
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                {activeTab === 'resume' ? 'Resume Template' : 'Interview Prep'}
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {activeTab === 'resume'
                  ? 'Upload or paste a resume, format with AI, then export.'
                  : 'Paste a JD, generate practice questions, or analyze fit against a saved resume.'}
              </p>
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
