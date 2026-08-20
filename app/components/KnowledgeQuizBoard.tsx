'use client';

import { useObject } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { QuizCodeLines, QuizPlainRichText, QuizRichText } from '@/app/components/QuizRichText';
import { aiFetch, aiRequestHeaders } from '@/lib/ai-request-headers';
import { useAppLanguage } from '@/lib/app-language';
import { getDeviceId } from '@/lib/device-id';
import type { KnowledgeQuizHistoryRecord } from '@/lib/knowledge-quiz-history';
import {
  KnowledgeQuizSchema,
  QUIZ_LEVELS,
  type KnowledgeQuiz,
  type QuizDifficulty,
  type QuizLevel,
} from '@/lib/knowledge-quiz';
import {
  JOB_CATEGORIES,
  type JobCategoryId,
} from '@/lib/leetcode-catalog';

type QuizFollowTurn = { role: 'user' | 'coach'; text: string };

type Props = {
  activeHistoryId?: string | null;
  resetKey?: number;
  onHistorySaved?: (id: string | null) => void;
};

function quizDifficultyClass(d: QuizDifficulty | string | undefined | null): string {
  if (d === 'easy') return 'bg-emerald-100 text-emerald-800';
  if (d === 'hard') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

function quizDifficultyLabel(
  d: QuizDifficulty | string | undefined | null,
  t: {
    practiceQuizDifficultyEasy: string;
    practiceQuizDifficultyMedium: string;
    practiceQuizDifficultyHard: string;
  }
): string {
  if (d === 'easy') return t.practiceQuizDifficultyEasy;
  if (d === 'hard') return t.practiceQuizDifficultyHard;
  return t.practiceQuizDifficultyMedium;
}

async function createQuizHistory(
  quiz: KnowledgeQuiz,
  language: string
): Promise<string> {
  const res = await fetch('/api/knowledge-quiz-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({ quiz, language }),
  });
  const data = (await res.json()) as { item?: { id: string }; error?: string };
  if (!res.ok || !data.item?.id) {
    throw new Error(data.error || 'Failed to save quiz');
  }
  return data.item.id;
}

async function updateQuizAnswers(
  id: string,
  answers: Record<string, number>
): Promise<void> {
  const res = await fetch(`/api/knowledge-quiz-history/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Failed to save answers');
  }
}

export default function KnowledgeQuizBoard({
  activeHistoryId = null,
  resetKey = 0,
  onHistorySaved,
}: Props) {
  const { language, t } = useAppLanguage();
  const [categoryId, setCategoryId] = useState<JobCategoryId>('frontend');
  const [quizLevel, setQuizLevel] = useState<QuizLevel>('mid');
  const [savedQuiz, setSavedQuiz] = useState<KnowledgeQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizOpenExplain, setQuizOpenExplain] = useState<Record<string, boolean>>(
    {}
  );
  const [quizFollowUps, setQuizFollowUps] = useState<
    Record<string, QuizFollowTurn[]>
  >({});
  const [quizFollowDraft, setQuizFollowDraft] = useState<Record<string, string>>(
    {}
  );
  const [quizFollowBusyId, setQuizFollowBusyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const skipNextExternalLoadRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const {
    object: quizObject,
    submit: submitQuiz,
    isLoading: quizLoading,
    error: quizError,
    clear: clearQuizStream,
  } = useObject({
    api: '/api/knowledge-quiz',
    schema: KnowledgeQuizSchema,
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) =>
      setLocalError(err.message || 'Failed to generate quiz. Please try again.'),
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = KnowledgeQuizSchema.safeParse(finished);
      if (!parsed.success) {
        console.error('[knowledge-quiz] schema mismatch', parsed.error.flatten());
        setLocalError(
          'Quiz generated but failed validation. Please try Generate again.'
        );
        return;
      }
      setSavedQuiz(parsed.data);
      setQuizAnswers({});
      setQuizChecked(false);
      setQuizOpenExplain({});
      setQuizFollowUps({});
      setQuizFollowDraft({});
      setQuizFollowBusyId(null);
      if (parsed.data.categoryId) {
        setCategoryId(parsed.data.categoryId);
      }
      if (parsed.data.quizLevel) {
        setQuizLevel(parsed.data.quizLevel);
      }

      void (async () => {
        try {
          const id = await createQuizHistory(parsed.data, language);
          setSessionId(id);
          sessionIdRef.current = id;
          skipNextExternalLoadRef.current = true;
          onHistorySaved?.(id);
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save quiz'
          );
        }
      })();
    },
  });

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const resetQuizLocal = () => {
    setSavedQuiz(null);
    setQuizAnswers({});
    setQuizChecked(false);
    setQuizOpenExplain({});
    setQuizFollowUps({});
    setQuizFollowDraft({});
    setQuizFollowBusyId(null);
    clearQuizStream();
  };

  const handleGenerateQuiz = () => {
    setLocalError(null);
    setSessionId(null);
    sessionIdRef.current = null;
    resetQuizLocal();
    submitQuiz({ categoryId, language, quizLevel });
  };

  const handleCheckQuiz = () => {
    setQuizChecked(true);
    const quiz = savedQuiz ?? (quizObject as KnowledgeQuiz | undefined | null);
    const open: Record<string, boolean> = {};
    for (const q of quiz?.questions ?? []) {
      if (q?.id) open[q.id] = true;
    }
    setQuizOpenExplain(open);

    const id = sessionIdRef.current;
    if (id) {
      void updateQuizAnswers(id, quizAnswers).catch((err) => {
        setLocalError(
          err instanceof Error ? err.message : 'Failed to save answers'
        );
      });
      onHistorySaved?.(id);
    }
  };

  const handleQuizFollowUp = async (questionId: string) => {
    const draft = (quizFollowDraft[questionId] || '').trim();
    if (!draft || quizFollowBusyId) return;

    const quiz = savedQuiz ?? (quizObject as KnowledgeQuiz | undefined | null);
    const item = quiz?.questions?.find((q) => q?.id === questionId);
    if (!item?.question) return;

    setQuizFollowBusyId(questionId);
    setLocalError(null);
    setQuizFollowDraft((prev) => ({ ...prev, [questionId]: '' }));
    setQuizFollowUps((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), { role: 'user', text: draft }],
    }));

    try {
      const res = await aiFetch('/api/knowledge-quiz-ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...aiRequestHeaders(),
        },
        body: JSON.stringify({
          language,
          followUp: draft,
          question: item.question,
          explanation: item.explanation || '',
          topic: item.topic || '',
          options: item.options || [],
          correctIndex: item.correctIndex,
        }),
      });
      if (!res.ok) {
        const msg =
          (await res.text().catch(() => '')) ||
          (res.status === 429
            ? 'Daily quiz follow-up limit reached (8/day). Try again tomorrow.'
            : 'Follow-up failed');
        throw new Error(msg);
      }
      const answer = (await res.text()).trim();
      setQuizFollowUps((prev) => ({
        ...prev,
        [questionId]: [
          ...(prev[questionId] || []),
          { role: 'coach', text: answer || '…' },
        ],
      }));
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to ask follow-up'
      );
      setQuizFollowDraft((prev) => ({ ...prev, [questionId]: draft }));
    } finally {
      setQuizFollowBusyId(null);
    }
  };

  const loadHistory = async (id: string) => {
    setLocalError(null);
    try {
      const res = await fetch(`/api/knowledge-quiz-history/${id}`, {
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as {
        item?: KnowledgeQuizHistoryRecord;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load quiz history');
      }
      clearQuizStream();
      setSessionId(data.item.id);
      sessionIdRef.current = data.item.id;
      setSavedQuiz(data.item.quiz);
      setQuizAnswers(data.item.answers || {});
      const hasAnswers = Object.keys(data.item.answers || {}).length > 0;
      setQuizChecked(hasAnswers || data.item.score != null);
      const open: Record<string, boolean> = {};
      if (hasAnswers || data.item.score != null) {
        for (const q of data.item.quiz?.questions ?? []) {
          if (q?.id) open[q.id] = true;
        }
      }
      setQuizOpenExplain(open);
      setQuizFollowUps({});
      setQuizFollowDraft({});
      setQuizFollowBusyId(null);
      if (data.item.category_id) {
        setCategoryId(data.item.category_id as JobCategoryId);
      }
      if (data.item.quiz_level) {
        setQuizLevel(data.item.quiz_level as QuizLevel);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to load quiz history'
      );
    }
  };

  useEffect(() => {
    if (!activeHistoryId) return;
    if (skipNextExternalLoadRef.current) {
      skipNextExternalLoadRef.current = false;
      return;
    }
    if (activeHistoryId === sessionIdRef.current) return;
    void loadHistory(activeHistoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHistoryId]);

  useEffect(() => {
    if (resetKey === 0) return;
    resetQuizLocal();
    setSessionId(null);
    sessionIdRef.current = null;
    setLocalError(null);
    setCategoryId('frontend');
    setQuizLevel('mid');
    skipNextExternalLoadRef.current = true;
    onHistorySaved?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const liveQuiz = savedQuiz ?? (quizObject as KnowledgeQuiz | undefined | null);
  const liveQuizQuestions =
    liveQuiz?.questions?.filter(
      (q): q is NonNullable<typeof q> => Boolean(q?.id && q.question)
    ) ?? [];
  const quizScore = liveQuizQuestions.reduce((acc, q) => {
    if (!q.id || typeof q.correctIndex !== 'number') return acc;
    return quizAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);
  const category =
    JOB_CATEGORIES.find((c) => c.id === categoryId) ?? JOB_CATEGORIES[0];
  const isZh = language === 'zh-CN' || language.startsWith('zh');
  const modeError =
    localError ||
    (quizError
      ? quizError.message || 'Failed to generate quiz. Please try again.'
      : null);

  return (
    <div className="space-y-6">
      {modeError && <p className="text-sm text-red-600">{modeError}</p>}

      <section className="space-y-6" aria-labelledby="quiz-panel-title">
        <div>
          <h3 id="quiz-panel-title" className="text-lg font-semibold text-slate-900">
            {t.practiceQuizTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{t.practiceQuizHelp}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-500">{t.practiceQuizSelectRole}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t.practiceCategories}
              </span>
              <select
                value={category.id}
                onChange={(e) => {
                  setCategoryId(e.target.value as JobCategoryId);
                  setLocalError(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--shell-tab-active)]"
              >
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isZh ? cat.labelZh : cat.labelEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t.practiceQuizLevelLabel}
              </span>
              <select
                value={quizLevel}
                onChange={(e) => setQuizLevel(e.target.value as QuizLevel)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--shell-tab-active)]"
              >
                {QUIZ_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level === 'junior'
                      ? t.practiceQuizLevelJunior
                      : level === 'senior'
                        ? t.practiceQuizLevelSenior
                        : t.practiceQuizLevelMid}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={quizLoading}
              className="shell-btn"
            >
              {quizLoading
                ? t.practiceQuizGenerating
                : liveQuizQuestions.length > 0
                  ? t.practiceQuizRetry
                  : t.practiceQuizCta}
            </button>
          </div>
        </div>

        {quizLoading && liveQuizQuestions.length === 0 && (
          <p className="text-sm text-slate-500">{t.practiceQuizWait}</p>
        )}

        {liveQuiz?.focusTopics && liveQuiz.focusTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {liveQuiz.focusTopics.filter(Boolean).map((topic, idx) => (
              <span
                key={`${topic}-${idx}`}
                className="rounded-md bg-[var(--shell-list-selected)] px-2 py-0.5 text-xs font-medium text-slate-800"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {liveQuizQuestions.length > 0 && (
          <ol className="space-y-4">
            {liveQuizQuestions.map((q, idx) => {
              if (!q.id) return null;
              const selected = quizAnswers[q.id];
              const revealed = quizChecked || Boolean(quizOpenExplain[q.id]);
              const isCorrect =
                typeof q.correctIndex === 'number' && selected === q.correctIndex;
              return (
                <li
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-sm font-semibold text-slate-400 tabular-nums">
                          {idx + 1}.
                        </span>
                        <QuizRichText text={q.question || ''} className="min-w-0 flex-1" />
                      </div>
                      {q.codeSnippet?.trim() ? (
                        <QuizCodeLines code={q.codeSnippet.trim()} />
                      ) : null}
                    </div>
                    {q.topic || q.difficulty ? (
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {q.difficulty ? (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${quizDifficultyClass(q.difficulty)}`}
                          >
                            {quizDifficultyLabel(q.difficulty, t)}
                          </span>
                        ) : null}
                        {q.topic ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {q.topic}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="space-y-2"
                    role="radiogroup"
                    aria-label={q.question || `Question ${idx + 1}`}
                  >
                    {(q.options ?? []).map((opt, optIdx) => {
                      if (!opt) return null;
                      const chosen = selected === optIdx;
                      const showKey =
                        revealed && typeof q.correctIndex === 'number';
                      const isRight = showKey && optIdx === q.correctIndex;
                      const isWrongPick = showKey && chosen && !isRight;
                      return (
                        <label
                          key={`${q.id}-${optIdx}`}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                            isRight
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                              : isWrongPick
                                ? 'border-rose-300 bg-rose-50 text-rose-950'
                                : chosen
                                  ? 'border-[var(--shell-tab-active)] bg-[var(--shell-list-selected)]'
                                  : 'border-slate-200 hover:border-slate-300'
                          } ${quizChecked ? 'cursor-default' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${q.id}`}
                            className="mt-0.5"
                            checked={chosen}
                            disabled={quizChecked}
                            onChange={() =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [q.id!]: optIdx,
                              }))
                            }
                          />
                          <span className="min-w-0 flex-1 font-normal">
                            <QuizPlainRichText
                              text={opt}
                              className="!space-y-0 [&_p]:text-sm [&_p]:font-normal"
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!quizChecked && (
                      <button
                        type="button"
                        disabled={typeof selected !== 'number'}
                        onClick={() =>
                          setQuizOpenExplain((prev) => ({
                            ...prev,
                            [q.id!]: true,
                          }))
                        }
                        className="text-xs font-medium text-[var(--shell-tab-active)] hover:underline disabled:opacity-40"
                      >
                        {t.practiceQuizExplain}
                      </button>
                    )}
                    {revealed && typeof selected === 'number' && (
                      <span
                        className={`text-xs font-semibold ${
                          isCorrect ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isCorrect ? t.practiceQuizCorrect : t.practiceQuizWrong}
                      </span>
                    )}
                  </div>

                  {revealed && q.explanation && (
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.practiceQuizExplain}
                        </p>
                        {typeof selected === 'number' && q.options?.[selected] && (
                          <p className="mt-1.5 text-xs text-slate-600">
                            {t.practiceQuizYourAnswer}: {q.options[selected]}
                          </p>
                        )}
                        <div className="mt-2 text-sm leading-relaxed text-slate-800">
                          <QuizPlainRichText text={q.explanation} />
                        </div>
                      </div>

                      {q.relatedLinks && q.relatedLinks.length > 0 && (
                        <div className="border-t border-slate-200/80 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t.practiceQuizRelated}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {q.relatedLinks
                              .filter((l) => l?.title && l?.url)
                              .map((link, linkIdx) => (
                                <li key={`${q.id}-link-${linkIdx}`}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-[var(--shell-tab-active)] hover:underline"
                                  >
                                    {link.title} →
                                  </a>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      <div className="border-t border-slate-200/80 pt-3 space-y-2">
                        {(quizFollowUps[q.id!] || []).map((turn, turnIdx) => (
                          <div
                            key={`${q.id}-follow-${turnIdx}`}
                            className={`rounded-lg px-2.5 py-2 text-sm ${
                              turn.role === 'user'
                                ? 'bg-white text-slate-800'
                                : 'bg-[var(--shell-list-selected)] text-slate-900'
                            }`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {turn.role === 'user'
                                ? t.practiceQuizAskYou
                                : t.practiceQuizAskCoach}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                              {turn.text}
                            </p>
                          </div>
                        ))}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <textarea
                            value={quizFollowDraft[q.id!] || ''}
                            onChange={(e) =>
                              setQuizFollowDraft((prev) => ({
                                ...prev,
                                [q.id!]: e.target.value,
                              }))
                            }
                            rows={2}
                            placeholder={t.practiceQuizAskPlaceholder}
                            disabled={quizFollowBusyId === q.id}
                            className="min-h-[2.75rem] w-full flex-1 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--shell-tab-active)] disabled:opacity-60"
                          />
                          <button
                            type="button"
                            onClick={() => void handleQuizFollowUp(q.id!)}
                            disabled={
                              quizFollowBusyId === q.id ||
                              !(quizFollowDraft[q.id!] || '').trim()
                            }
                            className="shell-btn shell-btn-sm shrink-0"
                          >
                            {quizFollowBusyId === q.id
                              ? t.practiceQuizAsking
                              : t.practiceQuizAskSend}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {liveQuizQuestions.length > 0 && !quizLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            {quizChecked ? (
              <p className="text-sm font-semibold text-slate-900">
                {t.practiceQuizScore
                  .replace('{score}', String(quizScore))
                  .replace('{total}', String(liveQuizQuestions.length))}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {Object.keys(quizAnswers).length}/{liveQuizQuestions.length}
              </p>
            )}
            {!quizChecked ? (
              <button
                type="button"
                onClick={handleCheckQuiz}
                disabled={Object.keys(quizAnswers).length === 0}
                className="shell-btn"
              >
                {t.practiceQuizSubmit}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={quizLoading}
                className="shell-btn"
              >
                {t.practiceQuizRetry}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
