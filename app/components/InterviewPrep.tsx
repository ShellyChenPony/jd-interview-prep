'use client';

import { useEffect, useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import { aiFetch, aiRequestHeaders } from '@/lib/ai-request-headers';
import { useAppLanguage } from '@/lib/app-language';
import { getDeviceId } from '@/lib/device-id';
import type { InterviewPrepHistoryRecord } from '@/lib/interview-prep-history';
import {
  CoverLetterSchema,
  InterviewPrepSchema,
  JdResumeMatchSchema,
  type CoverLetterResult,
  type InterviewPrepResult,
  type JdResumeMatchResult,
} from '@/lib/interview-prep';
import type { ResumeHistoryListItem } from '@/lib/resume-history';
import type { ResumeTemplate } from '@/lib/resume-template';

type PrepMode = 'questions' | 'match' | 'cover';

function ReviewLinks({
  links,
  label,
}: {
  links?: Array<{ title?: string; url?: string } | undefined>;
  label: string;
}) {
  if (!links?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
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
  coverLetter?: CoverLetterResult | null;
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
    coverLetter?: CoverLetterResult | null;
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

type Props = {
  activeHistoryId?: string | null;
  resetKey?: number;
  onHistorySaved?: (id: string | null) => void;
};

export default function InterviewPrep({
  activeHistoryId = null,
  resetKey = 0,
  onHistorySaved,
}: Props) {
  const { language, t } = useAppLanguage();
  const [mode, setMode] = useState<PrepMode>('questions');
  const [jdText, setJdText] = useState('');
  const [historyItems, setHistoryItems] = useState<ResumeHistoryListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [selectedResume, setSelectedResume] = useState<ResumeTemplate | null>(null);
  const [selectedResumeLabel, setSelectedResumeLabel] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [prepSessionId, setPrepSessionId] = useState<string | null>(null);
  const skipNextExternalLoadRef = useRef(false);
  const prepSessionIdRef = useRef<string | null>(null);
  const jdTextRef = useRef('');
  const resumeMetaRef = useRef({ historyId: '', label: '' });
  const savedPrepRef = useRef<InterviewPrepResult | null>(null);
  const [savedPrep, setSavedPrep] = useState<InterviewPrepResult | null>(null);
  const [savedMatch, setSavedMatch] = useState<JdResumeMatchResult | null>(null);
  const [savedCover, setSavedCover] = useState<CoverLetterResult | null>(null);
  const [letterCopied, setLetterCopied] = useState(false);

  const {
    object,
    submit,
    isLoading,
    error: generateError,
    clear: clearQuestions,
  } = useObject({
    api: '/api/generate',
    schema: InterviewPrepSchema,
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) => setLocalError(err.message || 'Failed to generate questions'),
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
            onHistorySaved?.(currentId);
          } else {
            const id = await createPrepHistory({
              jdText: currentJd,
              jobSummary: result.jobSummary,
              questions: result.questions,
            });
            setPrepSessionId(id);
            prepSessionIdRef.current = id;
            skipNextExternalLoadRef.current = true;
            onHistorySaved?.(id);
          }
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
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) => setLocalError(err.message || 'Failed to analyze JD vs resume'),
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
            onHistorySaved?.(currentId);
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
            skipNextExternalLoadRef.current = true;
            onHistorySaved?.(id);
          }
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save match history'
          );
        }
      })();
    },
  });

  const {
    object: coverObject,
    submit: submitCover,
    isLoading: coverLoading,
    error: coverError,
    clear: clearCoverStream,
  } = useObject({
    api: '/api/cover-letter',
    schema: CoverLetterSchema,
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) => setLocalError(err.message || 'Failed to generate cover letter'),
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = CoverLetterSchema.safeParse(finished);
      if (!parsed.success) return;
      setSavedCover(parsed.data);

      void (async () => {
        try {
          const currentId = prepSessionIdRef.current;
          const currentJd = jdTextRef.current;
          const { historyId, label } = resumeMetaRef.current;
          const prep = savedPrepRef.current;
          if (currentId) {
            await updatePrepHistory(currentId, {
              jdText: currentJd,
              coverLetter: parsed.data,
              resumeHistoryId: historyId || null,
              resumeLabel: label,
            });
            onHistorySaved?.(currentId);
          } else {
            const id = await createPrepHistory({
              jdText: currentJd,
              jobSummary: prep?.jobSummary ?? '',
              questions: prep?.questions ?? [],
              coverLetter: parsed.data,
              resumeHistoryId: historyId || null,
              resumeLabel: label,
            });
            setPrepSessionId(id);
            prepSessionIdRef.current = id;
            skipNextExternalLoadRef.current = true;
            onHistorySaved?.(id);
          }
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save cover letter history'
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
    submit({ jdText, language });
  };

  const handleMatch = () => {
    if (!jdText.trim()) {
      setLocalError(t.pasteJdFirst);
      return;
    }
    if (!selectedResume) {
      setLocalError(t.selectResumeFirst);
      return;
    }
    setLocalError(null);
    setMode('match');
    setSavedMatch(null);
    clearMatchStream();
    submitMatch({ jdText, resume: selectedResume, language });
  };

  const handleCoverLetter = () => {
    if (!jdText.trim()) {
      setLocalError(t.pasteJdFirst);
      return;
    }
    if (!selectedResume) {
      setLocalError(t.selectResumeFirst);
      return;
    }
    setLocalError(null);
    setMode('cover');
    setSavedCover(null);
    setLetterCopied(false);
    clearCoverStream();
    submitCover({ jdText, resume: selectedResume, language });
  };

  const handleCopyLetter = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLetterCopied(true);
      window.setTimeout(() => setLetterCopied(false), 2000);
    } catch {
      setLocalError('Failed to copy letter');
    }
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
      clearCoverStream();
      setJdText(item.jd_text || '');
      setPrepSessionId(item.id);
      prepSessionIdRef.current = item.id;
      setSavedPrep(
        asPrepResult(item.job_summary, item.questions_json)
      );
      setSavedMatch(item.match_json);
      setSavedCover(item.cover_letter_json);
      setLetterCopied(false);
      setSelectedHistoryId(item.resume_history_id || '');
      setSelectedResumeLabel(item.resume_label || '');
      setSelectedResume(null);

      if (item.resume_history_id) {
        void handleSelectResume(item.resume_history_id);
      }

      setMode(
        item.cover_letter_json
          ? 'cover'
          : item.match_json
            ? 'match'
            : 'questions'
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load prep history');
    }
  };

  useEffect(() => {
    if (!activeHistoryId) return;
    if (skipNextExternalLoadRef.current) {
      skipNextExternalLoadRef.current = false;
      return;
    }
    if (activeHistoryId === prepSessionIdRef.current) return;
    void handleSelectPrepHistory(activeHistoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHistoryId]);

  useEffect(() => {
    if (resetKey === 0) return;
    clearQuestions();
    clearMatchStream();
    clearCoverStream();
    setJdText('');
    setSavedPrep(null);
    setSavedMatch(null);
    setSavedCover(null);
    setLetterCopied(false);
    savedPrepRef.current = null;
    setPrepSessionId(null);
    prepSessionIdRef.current = null;
    setSelectedHistoryId('');
    setSelectedResume(null);
    setSelectedResumeLabel('');
    setLocalError(null);
    setMode('questions');
    skipNextExternalLoadRef.current = true;
    onHistorySaved?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const busy = isLoading || matchLoading || coverLoading;
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
  const liveCover =
    savedCover ??
    (coverObject ? (coverObject as CoverLetterResult) : null);
  const questionCount = livePrep?.questions?.filter(Boolean).length ?? 0;
  const modeError =
    localError ||
    (mode === 'questions' && generateError
      ? generateError.message || 'Failed to generate questions. Please try again.'
      : null) ||
    (mode === 'match' && matchError
      ? matchError.message || 'Failed to analyze JD vs resume. Please try again.'
      : null) ||
    (mode === 'cover' && coverError
      ? coverError.message || 'Failed to generate cover letter. Please try again.'
      : null);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            {t.jobDescription}
          </h2>
          <p className="text-sm text-slate-600 mt-1">{t.jdHelp}</p>
        </div>
        <textarea
          className="w-full h-40 md:h-48 p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition resize-y"
          placeholder={t.jdPlaceholder}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
      </section>

      <div
        role="tablist"
        aria-label="Interview prep tools"
        className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl"
      >
        {(
          [
            {
              id: 'questions' as const,
              label: t.questionsTab,
              hint: t.questionsHint,
            },
            {
              id: 'match' as const,
              label: t.matchTab,
              hint: t.matchHint,
            },
            {
              id: 'cover' as const,
              label: t.coverTab,
              hint: t.coverHint,
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
              <span className="block text-xs mt-0.5 opacity-90">{tab.hint}</span>
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
                {t.generateQuestionsTitle}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{t.generateQuestionsHelp}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateQuestions}
              disabled={busy || !jdText.trim()}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {isLoading ? t.generating : t.generate15}
            </button>
          </div>

          {isLoading && !livePrep && (
            <p className="text-sm text-slate-500">{t.generatingWait}</p>
          )}

          {livePrep && (
            <div className="space-y-5">
              {livePrep.jobSummary && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
                    {t.coreRequirement}
                  </p>
                  <p className="text-sm leading-relaxed">{livePrep.jobSummary}</p>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-900">{t.questions}</h4>
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
                        <span className="font-medium text-slate-800">{t.whyAsked} · </span>
                        {item.whyAsked}
                      </p>
                    )}

                    {item?.suggestedAnswer && (
                      <div className="ml-0 sm:ml-11 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          {t.suggestedAnswer}
                        </p>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {item.suggestedAnswer}
                        </p>
                      </div>
                    )}

                    {item?.keyPoints && item.keyPoints.length > 0 && (
                      <div className="sm:pl-11">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          {t.keyTips}
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                          {item.keyPoints.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="sm:pl-11">
                      <ReviewLinks links={item?.reviewLinks} label={t.reviewLinks} />
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
              {t.matchTitle}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{t.matchHelp}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="resume-history"
              >
                {t.resumeFromHistory}
              </label>
              <select
                id="resume-history"
                value={selectedHistoryId}
                onChange={(e) => void handleSelectResume(e.target.value)}
                disabled={busy || historyLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              >
                <option value="">
                  {historyLoading ? t.loading : t.selectResume}
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
                <p className="text-xs text-slate-600">
                  {t.selected}: {selectedResumeLabel}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleMatch}
              disabled={busy || !jdText.trim() || !selectedResume}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {matchLoading ? t.analyzing : t.analyzeFit}
            </button>
          </div>

          {matchLoading && !liveMatch && (
            <p className="text-sm text-slate-500">{t.analyzingWait}</p>
          )}

          {liveMatch && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-base font-semibold text-teal-950">{t.overallFit}</h4>
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
                      {t.strongMatches}
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
                      {t.gaps}
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
                    {t.improvementPlan}
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
                          <ReviewLinks links={item.reviewLinks} label={t.reviewLinks} />
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

      {mode === 'cover' && (
        <section className="space-y-6" aria-labelledby="cover-panel-title">
          <div>
            <h3 id="cover-panel-title" className="text-lg font-semibold text-slate-900">
              {t.coverTitle}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{t.coverHelp}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="cover-resume-history"
              >
                {t.resumeFromHistory}
              </label>
              <select
                id="cover-resume-history"
                value={selectedHistoryId}
                onChange={(e) => void handleSelectResume(e.target.value)}
                disabled={busy || historyLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {historyLoading ? t.loading : t.selectResume}
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
                <p className="text-xs text-slate-600">
                  {t.selected}: {selectedResumeLabel}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCoverLetter}
              disabled={busy || !jdText.trim() || !selectedResume}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {coverLoading ? t.generatingCover : t.generateCover}
            </button>
          </div>

          {coverLoading && !liveCover && (
            <p className="text-sm text-slate-500">{t.generatingCoverWait}</p>
          )}

          {liveCover && (
            <div className="space-y-4">
              {(liveCover.roleTitle || liveCover.companyHint) && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
                  {liveCover.roleTitle && (
                    <p className="text-base font-semibold text-indigo-950">
                      {liveCover.roleTitle}
                    </p>
                  )}
                  {liveCover.companyHint && (
                    <p className="text-sm text-indigo-900 mt-1">{liveCover.companyHint}</p>
                  )}
                </div>
              )}

              {liveCover.letter && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                      {t.coverLetter}
                    </h4>
                    <button
                      type="button"
                      onClick={() => void handleCopyLetter(liveCover.letter || '')}
                      disabled={!liveCover.letter}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {letterCopied ? t.letterCopied : t.copyLetter}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                    {liveCover.letter}
                    {coverLoading ? ' ▍' : ''}
                  </pre>
                </div>
              )}

              {liveCover.highlights && liveCover.highlights.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    {t.coverHighlights}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {liveCover.highlights.map((item, idx) =>
                      item ? <li key={`hl-${idx}`}>{item}</li> : null
                    )}
                  </ul>
                </div>
              )}

              {liveCover.tips && liveCover.tips.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    {t.coverTips}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {liveCover.tips.map((item, idx) =>
                      item ? <li key={`tip-${idx}`}>{item}</li> : null
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
