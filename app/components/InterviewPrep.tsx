'use client';

import { useEffect, useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import PrepHistoryDrawer from '@/app/components/PrepHistoryDrawer';
import { getDeviceId } from '@/lib/device-id';
import type { InterviewPrepHistoryRecord } from '@/lib/interview-prep-history';
import {
  InterviewPrepSchema,
  JdResumeMatchSchema,
  type InterviewPrepResult,
  type JdResumeMatchResult,
} from '@/lib/interview-prep';
import type { ResumeHistoryListItem } from '@/lib/resume-history';
import type { ResumeTemplate } from '@/lib/resume-template';

type PrepMode = 'questions' | 'match';

function ReviewLinks({
  links,
}: {
  links?: Array<{ title?: string; url?: string } | undefined>;
}) {
  if (!links?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        Review links
      </p>
      <ul className="space-y-1">
        {links.map((link, idx) => {
          if (!link?.url) return null;
          const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
          return (
            <li key={`${href}-${idx}`}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-700 hover:text-sky-900 hover:underline break-all"
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

function asPrepResult(
  jobSummary: string | undefined,
  questions: InterviewPrepResult['questions'] | undefined
): InterviewPrepResult | null {
  if (!questions?.length && !jobSummary?.trim()) return null;
  return {
    jobSummary: jobSummary ?? '',
    questions: questions ?? [],
  };
}

async function createPrepHistory(input: {
  jdText: string;
  jobSummary?: string;
  questions?: InterviewPrepResult['questions'];
  match?: JdResumeMatchResult | null;
  resumeHistoryId?: string | null;
  resumeLabel?: string;
}): Promise<string | null> {
  const res = await fetch('/api/interview-prep-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 503) return null;
  const data = (await res.json()) as { item?: { id?: string }; error?: string };
  if (!res.ok) throw new Error(data.error || 'Failed to save prep history');
  return data.item?.id ?? null;
}

async function updatePrepHistory(
  id: string,
  input: {
    jdText?: string;
    jobSummary?: string;
    questions?: InterviewPrepResult['questions'];
    match?: JdResumeMatchResult | null;
    resumeHistoryId?: string | null;
    resumeLabel?: string;
  }
): Promise<void> {
  const res = await fetch(`/api/interview-prep-history/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 503) return;
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || 'Failed to update prep history');
  }
}

export default function InterviewPrep() {
  const [mode, setMode] = useState<PrepMode>('questions');
  const [jdText, setJdText] = useState('');
  const [historyItems, setHistoryItems] = useState<ResumeHistoryListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [selectedResume, setSelectedResume] = useState<ResumeTemplate | null>(null);
  const [selectedResumeLabel, setSelectedResumeLabel] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [prepHistoryOpen, setPrepHistoryOpen] = useState(false);
  const [prepHistoryRefreshKey, setPrepHistoryRefreshKey] = useState(0);
  const [prepSessionId, setPrepSessionId] = useState<string | null>(null);
  const prepSessionIdRef = useRef<string | null>(null);
  const jdTextRef = useRef('');
  const resumeMetaRef = useRef({ historyId: '', label: '' });
  const savedPrepRef = useRef<InterviewPrepResult | null>(null);
  const [savedPrep, setSavedPrep] = useState<InterviewPrepResult | null>(null);
  const [savedMatch, setSavedMatch] = useState<JdResumeMatchResult | null>(null);

  const {
    object,
    submit,
    isLoading,
    error: generateError,
    clear: clearQuestions,
  } = useObject({
    api: '/api/generate',
    schema: InterviewPrepSchema,
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = InterviewPrepSchema.safeParse(finished);
      const result = parsed.success
        ? parsed.data
        : asPrepResult(
            finished.jobSummary,
            finished.questions as InterviewPrepResult['questions']
          );
      if (!result?.questions?.length) return;
      setSavedPrep(result);
      savedPrepRef.current = result;

      void (async () => {
        try {
          const currentId = prepSessionIdRef.current;
          const currentJd = jdTextRef.current;
          if (currentId) {
            await updatePrepHistory(currentId, {
              jdText: currentJd,
              jobSummary: result.jobSummary,
              questions: result.questions,
            });
          } else {
            const id = await createPrepHistory({
              jdText: currentJd,
              jobSummary: result.jobSummary,
              questions: result.questions,
            });
            setPrepSessionId(id);
            prepSessionIdRef.current = id;
          }
          setPrepHistoryRefreshKey((n) => n + 1);
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save questions history'
          );
        }
      })();
    },
  });

  const {
    object: matchObject,
    submit: submitMatch,
    isLoading: matchLoading,
    error: matchError,
    clear: clearMatchStream,
  } = useObject({
    api: '/api/jd-match',
    schema: JdResumeMatchSchema,
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = JdResumeMatchSchema.safeParse(finished);
      if (!parsed.success) return;
      setSavedMatch(parsed.data);

      void (async () => {
        try {
          const currentId = prepSessionIdRef.current;
          const currentJd = jdTextRef.current;
          const { historyId, label } = resumeMetaRef.current;
          const prep = savedPrepRef.current;
          if (currentId) {
            await updatePrepHistory(currentId, {
              jdText: currentJd,
              match: parsed.data,
              resumeHistoryId: historyId || null,
              resumeLabel: label,
            });
          } else {
            const id = await createPrepHistory({
              jdText: currentJd,
              jobSummary: prep?.jobSummary ?? '',
              questions: prep?.questions ?? [],
              match: parsed.data,
              resumeHistoryId: historyId || null,
              resumeLabel: label,
            });
            setPrepSessionId(id);
            prepSessionIdRef.current = id;
          }
          setPrepHistoryRefreshKey((n) => n + 1);
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save match history'
          );
        }
      })();
    },
  });

  useEffect(() => {
    prepSessionIdRef.current = prepSessionId;
  }, [prepSessionId]);

  useEffect(() => {
    jdTextRef.current = jdText;
  }, [jdText]);

  useEffect(() => {
    resumeMetaRef.current = {
      historyId: selectedHistoryId,
      label: selectedResumeLabel,
    };
  }, [selectedHistoryId, selectedResumeLabel]);

  useEffect(() => {
    savedPrepRef.current = savedPrep;
  }, [savedPrep]);

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
          setHistoryError('Resume history unavailable (Supabase not configured).');
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

  const handleSelectResume = async (id: string) => {
    setSelectedHistoryId(id);
    setSelectedResume(null);
    setSelectedResumeLabel('');
    setLocalError(null);
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

  const handleGenerateQuestions = () => {
    if (!jdText.trim()) return;
    setLocalError(null);
    setMode('questions');
    setSavedPrep(null);
    // New JD generation starts a fresh prep session.
    setPrepSessionId(null);
    prepSessionIdRef.current = null;
    clearQuestions();
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
    setMode('match');
    setSavedMatch(null);
    clearMatchStream();
    submitMatch({ jdText, resume: selectedResume });
  };

  const handleSelectPrepHistory = async (id: string) => {
    setLocalError(null);
    try {
      const res = await fetch(`/api/interview-prep-history/${id}`, {
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as {
        item?: InterviewPrepHistoryRecord;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load prep history');
      }

      const item = data.item;
      clearQuestions();
      clearMatchStream();
      setJdText(item.jd_text || '');
      setPrepSessionId(item.id);
      prepSessionIdRef.current = item.id;
      setSavedPrep(
        asPrepResult(item.job_summary, item.questions_json)
      );
      setSavedMatch(item.match_json);
      setSelectedHistoryId(item.resume_history_id || '');
      setSelectedResumeLabel(item.resume_label || '');
      setSelectedResume(null);

      if (item.resume_history_id) {
        void handleSelectResume(item.resume_history_id);
      }

      setMode(item.match_json ? 'match' : 'questions');
      setPrepHistoryOpen(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load prep history');
    }
  };

  const busy = isLoading || matchLoading;
  const livePrep =
    savedPrep ??
    asPrepResult(
      object?.jobSummary,
      (object?.questions?.filter(Boolean) as InterviewPrepResult['questions'] | undefined) ??
        undefined
    );
  const liveMatch =
    savedMatch ??
    (matchObject ? (matchObject as JdResumeMatchResult) : null);
  const questionCount = livePrep?.questions?.filter(Boolean).length ?? 0;
  const modeError =
    localError ||
    (mode === 'questions' && generateError
      ? 'Failed to generate questions. Please try again.'
      : null) ||
    (mode === 'match' && matchError
      ? 'Failed to analyze JD vs resume. Please try again.'
      : null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Job Description
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            粘贴目标岗位 JD，再选择下方功能。生成结果会自动存入 Prep History。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPrepHistoryOpen(true)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
        >
          Prep History
        </button>
      </div>

      <section className="space-y-3">
        <textarea
          className="w-full h-40 md:h-48 p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition resize-y"
          placeholder="Paste the Job Description (JD) here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
      </section>

      <div
        role="tablist"
        aria-label="Interview prep tools"
        className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl"
      >
        {(
          [
            {
              id: 'questions' as const,
              label: '15 Questions',
              hint: '练习题 + 参考答案',
            },
            {
              id: 'match' as const,
              label: 'JD × Resume',
              hint: '匹配分析 + 提升建议',
            },
          ] as const
        ).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(tab.id);
                setLocalError(null);
              }}
              className={`rounded-xl px-3 py-3 text-left transition ${
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="block text-xs mt-0.5 opacity-70">{tab.hint}</span>
            </button>
          );
        })}
      </div>

      {modeError && <p className="text-sm text-red-600">{modeError}</p>}

      {mode === 'questions' && (
        <section className="space-y-6" aria-labelledby="questions-panel-title">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h3
                id="questions-panel-title"
                className="text-lg font-semibold text-slate-900"
              >
                Generate interview questions
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                基于 JD 生成 15 道高频题，每题含建议答案与复习链接。
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateQuestions}
              disabled={busy || !jdText.trim()}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {isLoading ? 'Generating…' : 'Generate 15 questions'}
            </button>
          </div>

          {isLoading && !livePrep && (
            <p className="text-sm text-slate-500">
              正在分析 JD 并生成题目，大约需要一分钟…
            </p>
          )}

          {livePrep && (
            <div className="space-y-5">
              {livePrep.jobSummary && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
                    Core requirement
                  </p>
                  <p className="text-sm leading-relaxed">{livePrep.jobSummary}</p>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-900">Questions</h4>
                <span className="text-xs tabular-nums text-slate-500">
                  {questionCount} / 15
                  {isLoading ? ' · streaming' : ''}
                </span>
              </div>

              <ol className="space-y-4">
                {livePrep.questions?.map((item, index) => (
                  <li
                    key={`question-${index}-${item?.id ?? 'pending'}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold">
                        {item?.id ?? index + 1}
                      </span>
                      <h5 className="text-base md:text-lg font-semibold text-slate-900 leading-snug">
                        {item?.question}
                      </h5>
                    </div>

                    {item?.whyAsked && (
                      <p className="text-sm text-slate-600 leading-relaxed pl-11">
                        <span className="font-medium text-slate-800">Why asked · </span>
                        {item.whyAsked}
                      </p>
                    )}

                    {item?.suggestedAnswer && (
                      <div className="ml-0 sm:ml-11 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          Suggested answer
                        </p>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {item.suggestedAnswer}
                        </p>
                      </div>
                    )}

                    {item?.keyPoints && item.keyPoints.length > 0 && (
                      <div className="sm:pl-11">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          Key tips
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                          {item.keyPoints.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="sm:pl-11">
                      <ReviewLinks links={item?.reviewLinks} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {mode === 'match' && (
        <section className="space-y-6" aria-labelledby="match-panel-title">
          <div>
            <h3 id="match-panel-title" className="text-lg font-semibold text-slate-900">
              Compare JD with your resume
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              从 Resume History 选择简历，分析匹配点、缺口与应聘前提升建议。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="resume-history"
              >
                Resume from History
              </label>
              <select
                id="resume-history"
                value={selectedHistoryId}
                onChange={(e) => void handleSelectResume(e.target.value)}
                disabled={busy || historyLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
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
                <p className="text-xs text-slate-600">Selected: {selectedResumeLabel}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleMatch}
              disabled={busy || !jdText.trim() || !selectedResume}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {matchLoading ? 'Analyzing…' : 'Analyze fit'}
            </button>
          </div>

          {matchLoading && !liveMatch && (
            <p className="text-sm text-slate-500">正在比对 JD 与简历…</p>
          )}

          {liveMatch && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-base font-semibold text-teal-950">Overall fit</h4>
                  {typeof liveMatch.fitScore === 'number' && (
                    <span className="text-sm font-semibold tabular-nums text-teal-900">
                      {liveMatch.fitScore}/100
                    </span>
                  )}
                </div>
                {liveMatch.overallFit && (
                  <p className="text-sm text-teal-950 leading-relaxed">
                    {liveMatch.overallFit}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {liveMatch.strongMatches && liveMatch.strongMatches.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                      适合的点
                    </h4>
                    <ul className="space-y-3">
                      {liveMatch.strongMatches.map((item, idx) =>
                        item ? (
                          <li key={`fit-${idx}`} className="text-sm">
                            <p className="font-medium text-slate-900">{item.point}</p>
                            {item.evidence && (
                              <p className="text-slate-600 mt-0.5 leading-relaxed">
                                {item.evidence}
                              </p>
                            )}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}

                {liveMatch.gaps && liveMatch.gaps.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                      不合适 / 缺口
                    </h4>
                    <ul className="space-y-3">
                      {liveMatch.gaps.map((item, idx) =>
                        item ? (
                          <li key={`gap-${idx}`} className="text-sm">
                            <p className="font-medium text-slate-900">{item.point}</p>
                            {item.impact && (
                              <p className="text-slate-600 mt-0.5 leading-relaxed">
                                {item.impact}
                              </p>
                            )}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {liveMatch.improvementPlan && liveMatch.improvementPlan.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    如果要应聘：提升建议
                  </h4>
                  <ol className="space-y-3">
                    {liveMatch.improvementPlan.map((item, idx) =>
                      item ? (
                        <li
                          key={`plan-${idx}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {idx + 1}. {item.action}
                            </span>
                            {item.priority && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                  item.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                          {item.detail && (
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {item.detail}
                            </p>
                          )}
                          <ReviewLinks links={item.reviewLinks} />
                        </li>
                      ) : null
                    )}
                  </ol>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <PrepHistoryDrawer
        open={prepHistoryOpen}
        onClose={() => setPrepHistoryOpen(false)}
        onSelect={handleSelectPrepHistory}
        refreshKey={prepHistoryRefreshKey}
      />
    </div>
  );
}
