'use client';

import { useState } from 'react';
import InterviewPrep from '@/app/components/InterviewPrep';
import ResumeTemplate from '@/app/components/ResumeTemplate';

type TabId = 'interview' | 'resume';

const tabs: { id: TabId; label: string }[] = [
  { id: 'interview', label: 'Interview Prep' },
  { id: 'resume', label: 'Resume Template' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('interview');

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 font-sans">
      <header className="mb-8 text-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          AI Remote Job Interview Prep
        </h1>
        <p className="text-gray-600">
          Prepare for remote interviews and polish a ready-to-use English resume.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Main sections"
        className="flex gap-1 p-1 mb-8 bg-gray-100 rounded-xl print:hidden"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'interview' ? <InterviewPrep /> : <ResumeTemplate />}
      </div>
    </main>
  );
}
