'use client';

import { useObject } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import { getDeviceId } from '@/lib/device-id';
import {
  JOB_CATEGORIES,
  leetcodeUrl,
  problemsForCategory,
  type JobCategoryId,
  type ProblemDifficulty,
} from '@/lib/leetcode-catalog';
import {
  PracticeRecommendSchema,
  resolveRecommendations,
  type PracticeRecommendResult,
  type ResolvedRecommendation,
} from '@/lib/practice';
import type { PracticeHistoryRecord } from '@/lib/practice-history';

type PracticeMode = 'browse' | 'recommend';

type Props = {
  selectedCategoryId?: JobCategoryId | null;
  activeHistoryId?: string | null;
  resetKey?: number;
  onCategoryChange?: (id: JobCategoryId) => void;
  onHistorySaved?: (id: string | null) => void;
};

function difficultyClass(d: ProblemDifficulty | string | undefined | null): string {
  if (d === 'Easy') return 'bg-emerald-100 text-emerald-800';
  if (d === 'Hard') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

function priorityClass(p: string | undefined | null): string {
  const v = (p ?? '').toLowerCase();
  if (v === 'high') return 'bg-red-100 text-red-800';
  if (v === 'low') return 'bg-slate-200 text-slate-700';
  return 'bg-amber-100 text-amber-800';
}

async function createPracticeHistory(
  jdText: string,
  recommend: PracticeRecommendResult
): Promise<string | null> {
  const res = await fetch('/api/practice-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({ jdText, recommend }),
  });
  if (res.status === 503) return null;
  const data = (await res.json()) as { item?: { id?: string }; error?: string };
  if (!res.ok) throw new Error(data.error || 'Failed to save practice history');
  return data.item?.id ?? null;
}

export default function PracticeBoard({
  selectedCategoryId = 'frontend',
  activeHistoryId = null,
  resetKey = 0,
  onCategoryChange,
  onHistorySaved,
}: Props) {
  const { language, t } = useAppLanguage();
  const [mode, setMode] = useState<PracticeMode>('browse');
  const [categoryId, setCategoryId] = useState<JobCategoryId>(
    selectedCategoryId || 'frontend'
  );
  const [jdText, setJdText] = useState('');
  const [savedRecommend, setSavedRecommend] =
    useState<PracticeRecommendResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const skipNextExternalLoadRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const jdTextRef = useRef('');

  const {
    object,
    submit,
    isLoading,
    error: recommendError,
    clear,
  } = useObject({
    api: '/api/practice-recommend',
    schema: PracticeRecommendSchema,
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = PracticeRecommendSchema.safeParse(finished);
      if (!parsed.success) return;
      setSavedRecommend(parsed.data);
      if (parsed.data.primaryCategory) {
        setCategoryId(parsed.data.primaryCategory);
        onCategoryChange?.(parsed.data.primaryCategory);
      }

      void (async () => {
        try {
          const id = await createPracticeHistory(jdTextRef.current, parsed.data);
          setSessionId(id);
          sessionIdRef.current = id;
          skipNextExternalLoadRef.current = true;
          onHistorySaved?.(id);
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save recommendation'
          );
        }
      })();
    },
  });

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    jdTextRef.current = jdText;
  }, [jdText]);

  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== categoryId) {
      setCategoryId(selectedCategoryId);
      setMode('browse');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const handleSelectCategory = (id: JobCategoryId) => {
    setCategoryId(id);
    setMode('browse');
    onCategoryChange?.(id);
  };

  const handleRecommend = () => {
    if (!jdText.trim()) {
      setLocalError(t.pasteJdFirst);
      return;
    }
    setLocalError(null);
    setMode('recommend');
    setSavedRecommend(null);
    setSessionId(null);
    sessionIdRef.current = null;
    clear();
    submit({ jdText, language });
  };

  const loadHistory = async (id: string) => {
    setLocalError(null);
    try {
      const res = await fetch(`/api/practice-history/${id}`, {
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as {
        item?: PracticeHistoryRecord;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load practice history');
      }
      clear();
      setJdText(data.item.jd_text || '');
      setSessionId(data.item.id);
      sessionIdRef.current = data.item.id;
      setSavedRecommend(data.item.raw);
      if (data.item.primary_category) {
        setCategoryId(data.item.primary_category as JobCategoryId);
        onCategoryChange?.(data.item.primary_category as JobCategoryId);
      }
      setMode('recommend');
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to load practice history'
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
    clear();
    setJdText('');
    setSavedRecommend(null);
    setSessionId(null);
    sessionIdRef.current = null;
    setLocalError(null);
    setMode('browse');
    skipNextExternalLoadRef.current = true;
    onHistorySaved?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const liveRecommend = savedRecommend ?? (object as PracticeRecommendResult | undefined);
  const resolved: ResolvedRecommendation[] = liveRecommend
    ? resolveRecommendations({
        detectedRole: liveRecommend.detectedRole ?? '',
        primaryCategory: liveRecommend.primaryCategory ?? 'general',
        focusAreas: (liveRecommend.focusAreas?.filter(Boolean) as string[]) ?? [],
        recommendations:
          (liveRecommend.recommendations?.filter(
            (r): r is NonNullable<typeof r> => Boolean(r?.problemId)
          ) as PracticeRecommendResult['recommendations']) ?? [],
      })
    : [];

  const category =
    JOB_CATEGORIES.find((c) => c.id === categoryId) ?? JOB_CATEGORIES[0];
  const problems = problemsForCategory(category.id);
  const isZh = language === 'zh-CN' || language.startsWith('zh');
  const modeError =
    localError ||
    (mode === 'recommend' && recommendError
      ? 'Failed to recommend problems. Please try again.'
      : null);

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="Practice modes"
        className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl"
      >
        {(
          [
            { id: 'browse' as const, label: t.practiceBrowseTab, hint: t.practiceBrowseHint },
            {
              id: 'recommend' as const,
              label: t.practiceRecommendTab,
              hint: t.practiceRecommendHint,
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

      {mode === 'browse' && (
        <section className="space-y-5" aria-labelledby="browse-panel-title">
          <div>
            <h3 id="browse-panel-title" className="text-lg font-semibold text-slate-900">
              {isZh ? category.labelZh : category.labelEn}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {isZh ? category.descriptionZh : category.descriptionEn}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((cat) => {
              const active = cat.id === category.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {isZh ? cat.labelZh : cat.labelEn}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            {problems.length} {t.practiceProblems} · LeetCode
          </p>

          <ul className="space-y-2">
            {problems.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    <span className="text-slate-400 tabular-nums mr-2">#{p.number}</span>
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{p.tags.join(' · ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${difficultyClass(p.difficulty)}`}
                  >
                    {p.difficulty}
                  </span>
                  <a
                    href={leetcodeUrl(p.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-700 hover:underline"
                  >
                    {t.practiceOpen}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mode === 'recommend' && (
        <section className="space-y-6" aria-labelledby="recommend-panel-title">
          <div>
            <h3
              id="recommend-panel-title"
              className="text-lg font-semibold text-slate-900"
            >
              {t.practiceRecommendTitle}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{t.practiceRecommendHelp}</p>
          </div>

          <textarea
            className="w-full h-36 md:h-44 p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition resize-y"
            placeholder={t.jdPlaceholder}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRecommend}
              disabled={isLoading || !jdText.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium disabled:opacity-50 transition"
            >
              {isLoading ? t.practiceRecommending : t.practiceRecommendCta}
            </button>
          </div>

          {isLoading && resolved.length === 0 && (
            <p className="text-sm text-slate-500">{t.practiceRecommendWait}</p>
          )}

          {liveRecommend && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 space-y-2">
                {liveRecommend.detectedRole && (
                  <p className="text-base font-semibold text-orange-950">
                    {liveRecommend.detectedRole}
                  </p>
                )}
                {liveRecommend.primaryCategory && (
                  <p className="text-sm text-orange-900">
                    {t.practicePrimaryCategory}:{' '}
                    {isZh
                      ? JOB_CATEGORIES.find((c) => c.id === liveRecommend.primaryCategory)
                          ?.labelZh
                      : JOB_CATEGORIES.find((c) => c.id === liveRecommend.primaryCategory)
                          ?.labelEn}
                  </p>
                )}
                {liveRecommend.focusAreas && liveRecommend.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {liveRecommend.focusAreas.map((area, idx) =>
                      area ? (
                        <span
                          key={`${area}-${idx}`}
                          className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-orange-900"
                        >
                          {area}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-3">
                {resolved.map((item, idx) => (
                  <li
                    key={`${item.problemId}-${idx}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="text-slate-400 tabular-nums mr-2">
                            #{item.problem.number}
                          </span>
                          {item.problem.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.problem.tags.join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.priority ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-md ${priorityClass(item.priority)}`}
                          >
                            {item.priority}
                          </span>
                        ) : null}
                        {item.problem.difficulty ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-md ${difficultyClass(item.problem.difficulty)}`}
                          >
                            {item.problem.difficulty}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-slate-700 leading-relaxed">{item.reason}</p>
                    )}
                    <a
                      href={leetcodeUrl(item.problem.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-sky-700 hover:underline"
                    >
                      {t.practiceOpen} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
