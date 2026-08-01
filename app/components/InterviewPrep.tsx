'use client';

import { useEffect, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import { getDeviceId } from '@/lib/device-id';
import {
  InterviewPrepSchema,
  JdResumeMatchSchema,
} from '@/lib/interview-prep';
import type { ResumeHistoryListItem } from '@/lib/resume-history';
import type { ResumeTemplate } from '@/lib/resume-template';

function ReviewLinks({
  links,
}: {
  links?: Array<{ title?: string; url?: string } | undefined>;
}) {
  if (!links?.length) return null;
  return (
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Review links
      </span>
      <ul className="mt-1 space-y-1">
        {links.map((link, idx) => {
          if (!link?.url) return null;
          const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
          return (
            <li key={`${href}-${idx}`}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline break-all"
              >
                {link.title || href}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function InterviewPrep() {
  const [jdText, setJdText] = useState('');
  const [historyItems, setHistoryItems] = useState<ResumeHistoryListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [selectedResume, setSelectedResume] = useState<ResumeTemplate | null>(null);
  const [selectedResumeLabel, setSelectedResumeLabel] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    object,
    submit,
    isLoading,
    error: generateError,
  } = useObject({
    api: '/api/generate',
    schema: InterviewPrepSchema,
  });

  const {
    object: matchObject,
    submit: submitMatch,
    isLoading: matchLoading,
    error: matchError,
    clear: clearMatch,
  } = useObject({
    api: '/api/jd-match',
    schema: JdResumeMatchSchema,
  });

  useEffect(() => {
    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError(null);

    fetch('/api/resume-history', {
      headers: { 'x-device-id': getDeviceId() },
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          items?: ResumeHistoryListItem[];
          error?: string;
        };
        if (res.status === 503) {
          setHistoryItems([]);
          setHistoryError('History unavailable (Supabase not configured).');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load history');
        setHistoryItems(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => setHistoryLoading(false));

    return () => controller.abort();
  }, []);

  const handleSelectHistory = async (id: string) => {
    setSelectedHistoryId(id);
    setSelectedResume(null);
    setSelectedResumeLabel('');
    setLocalError(null);
    clearMatch();
    if (!id) return;

    try {
      const res = await fetch(`/api/resume-history/${id}`, {
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as {
        item?: {
          id: string;
          name: string;
          job_title: string;
          resume_json: ResumeTemplate;
        };
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load resume');
      }
      setSelectedResume(data.item.resume_json);
      setSelectedResumeLabel(
        `${data.item.name || 'Untitled'}${
          data.item.job_title ? ` · ${data.item.job_title}` : ''
        }`
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load resume');
      setSelectedHistoryId('');
    }
  };

  const handleGenerateQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    setLocalError(null);
    submit({ jdText });
  };

  const handleMatch = () => {
    if (!jdText.trim()) {
      setLocalError('请先粘贴 JD。');
      return;
    }
    if (!selectedResume) {
      setLocalError('请先从 History 选择一份简历。');
      return;
    }
    setLocalError(null);
    submitMatch({ jdText, resume: selectedResume });
  };

  const busy = isLoading || matchLoading;

  return (
    <>
      <form onSubmit={handleGenerateQuestions} className="mb-8 space-y-4">
        <textarea
          className="w-full h-44 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition border-gray-300"
          placeholder="Paste the Job Description (JD) here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy || !jdText.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50 transition shadow"
        >
          {isLoading
            ? 'Analyzing JD & Generating 15 questions...'
            : 'Generate 15 Interview Questions ✨'}
        </button>
      </form>

      <section className="mb-10 p-5 border border-gray-200 rounded-2xl bg-gray-50/80 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">JD vs Resume Match</h2>
          <p className="text-sm text-gray-600 mt-1">
            从 History 选择一份简历，对比当前 JD：适合点、缺口，以及应聘前如何提升（含参考链接）。
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor="resume-history">
            Resume from History
          </label>
          <select
            id="resume-history"
            value={selectedHistoryId}
            onChange={(e) => void handleSelectHistory(e.target.value)}
            disabled={busy || historyLoading}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {historyLoading ? 'Loading history...' : 'Select a saved resume...'}
            </option>
            {historyItems.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.name || 'Untitled') +
                  (item.job_title ? ` · ${item.job_title}` : '') +
                  ` · ${new Date(item.created_at).toLocaleDateString()}`}
              </option>
            ))}
          </select>
          {historyError && (
            <p className="text-xs text-amber-700">{historyError}</p>
          )}
          {selectedResumeLabel && (
            <p className="text-xs text-gray-600">Selected: {selectedResumeLabel}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleMatch}
          disabled={busy || !jdText.trim() || !selectedResume}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl disabled:opacity-50 transition shadow"
        >
          {matchLoading ? 'Comparing JD & Resume...' : 'Analyze Fit & Improvement Plan'}
        </button>
      </section>

      {(localError || generateError || matchError) && (
        <p className="mb-6 text-sm text-red-600">
          {localError ||
            (generateError
              ? 'Failed to generate questions. Please try again.'
              : 'Failed to analyze JD vs resume. Please try again.')}
        </p>
      )}

      {matchObject && (
        <section className="mb-10 space-y-5">
          <div className="p-5 border border-indigo-200 bg-indigo-50 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-indigo-950">Fit analysis</h2>
              {typeof matchObject.fitScore === 'number' && (
                <span className="text-sm font-semibold text-indigo-800">
                  Score: {matchObject.fitScore}/100
                </span>
              )}
            </div>
            {matchObject.overallFit && (
              <p className="text-sm text-indigo-950 leading-relaxed">
                {matchObject.overallFit}
              </p>
            )}
          </div>

          {matchObject.strongMatches && matchObject.strongMatches.length > 0 && (
            <div className="p-5 border rounded-2xl bg-white space-y-3">
              <h3 className="font-semibold text-emerald-800">适合的点</h3>
              <ul className="space-y-3">
                {matchObject.strongMatches.map((item, idx) =>
                  item ? (
                    <li key={idx} className="text-sm">
                      <p className="font-medium text-gray-900">{item.point}</p>
                      {item.evidence && (
                        <p className="text-gray-600 mt-0.5">{item.evidence}</p>
                      )}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          {matchObject.gaps && matchObject.gaps.length > 0 && (
            <div className="p-5 border rounded-2xl bg-white space-y-3">
              <h3 className="font-semibold text-amber-800">不合适 / 缺口</h3>
              <ul className="space-y-3">
                {matchObject.gaps.map((item, idx) =>
                  item ? (
                    <li key={idx} className="text-sm">
                      <p className="font-medium text-gray-900">{item.point}</p>
                      {item.impact && (
                        <p className="text-gray-600 mt-0.5">{item.impact}</p>
                      )}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          {matchObject.improvementPlan && matchObject.improvementPlan.length > 0 && (
            <div className="p-5 border rounded-2xl bg-white space-y-4">
              <h3 className="font-semibold text-gray-900">如果要应聘：提升建议</h3>
              {matchObject.improvementPlan.map((item, idx) =>
                item ? (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {idx + 1}. {item.action}
                      </span>
                      {item.priority && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      )}
                    </div>
                    {item.detail && (
                      <p className="text-sm text-gray-700 leading-relaxed">{item.detail}</p>
                    )}
                    <ReviewLinks links={item.reviewLinks} />
                  </div>
                ) : null
              )}
            </div>
          )}
        </section>
      )}

      {object && (
        <section className="space-y-6">
          {object.jobSummary && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              <span className="font-semibold">Core Requirement: </span>
              {object.jobSummary}
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Interview questions</h2>
            <span className="text-xs text-gray-500">
              {object.questions?.filter(Boolean).length ?? 0} / 15
            </span>
          </div>

          <div className="space-y-4">
            {object.questions?.map((item, index) => (
              <div
                key={`question-${index}-${item?.id ?? 'pending'}`}
                className="p-6 border rounded-2xl shadow-sm bg-white space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm shrink-0">
                    Q{item?.id ?? index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{item?.question}</h3>
                </div>

                {item?.whyAsked && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">Why Asked: </span>
                    {item.whyAsked}
                  </p>
                )}

                {item?.suggestedAnswer && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">
                      Suggested answer
                    </p>
                    <p className="text-sm text-blue-950 leading-relaxed whitespace-pre-wrap">
                      {item.suggestedAnswer}
                    </p>
                  </div>
                )}

                {item?.keyPoints && item.keyPoints.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Key tips
                    </span>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
                      {item.keyPoints.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <ReviewLinks links={item?.reviewLinks} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
