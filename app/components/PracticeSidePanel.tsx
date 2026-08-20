'use client';

import { useEffect, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import { getDeviceId } from '@/lib/device-id';
import {
  JOB_CATEGORIES,
  type JobCategoryId,
} from '@/lib/leetcode-catalog';
import type { PracticeHistoryListItem } from '@/lib/practice-history';

type Props = {
  selectedCategoryId?: JobCategoryId | null;
  selectedHistoryId?: string | null;
  onSelectCategory: (id: JobCategoryId) => void;
  onSelectHistory: (id: string) => void;
  refreshKey?: number;
  onNew?: () => void;
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PracticeSidePanel({
  selectedCategoryId,
  selectedHistoryId,
  onSelectCategory,
  onSelectHistory,
  refreshKey = 0,
  onNew,
}: Props) {
  const { language, t } = useAppLanguage();
  const isZh = language === 'zh-CN' || language.startsWith('zh');
  const [items, setItems] = useState<PracticeHistoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/practice-history', {
      headers: { 'x-device-id': getDeviceId() },
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          items?: PracticeHistoryListItem[];
          error?: string;
        };
        if (res.status === 503) {
          setItems([]);
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load history');
        setItems(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/practice-history/${id}`, {
        method: 'DELETE',
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col text-[var(--foreground)]">
      <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-3">
        <div>
          <h2 className="text-lg font-semibold">{t.practiceSideTitle}</h2>
          <p className="text-xs text-[var(--shell-muted)] mt-0.5">
            {t.practiceSideHint}
          </p>
        </div>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="shrink-0 rounded-full bg-[var(--shell-accent-btn)] px-3 py-1.5 text-xs font-medium text-[var(--shell-accent-btn-text)] hover:opacity-90"
          >
            {t.new}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        <section>
          <h3 className="px-1 mb-2 text-xs font-medium text-[var(--shell-subtle)] uppercase tracking-wide">
            {t.practiceCategories}
          </h3>
          <ul className="space-y-1.5">
            {JOB_CATEGORIES.map((cat) => {
              const active = selectedCategoryId === cat.id && !selectedHistoryId;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-[var(--shell-list-selected-border)] bg-[var(--shell-list-selected)] shadow-sm'
                        : 'border-transparent hover:bg-[var(--shell-list-hover)]'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {isZh ? cat.labelZh : cat.labelEn}
                    </p>
                    <p className="text-[11px] text-[var(--shell-subtle)] mt-0.5 line-clamp-2">
                      {isZh ? cat.descriptionZh : cat.descriptionEn}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="px-1 mb-2 text-xs font-medium text-[var(--shell-subtle)] uppercase tracking-wide">
            {t.practiceHistory}
          </h3>
          {loading && (
            <p className="px-1 text-sm text-[var(--shell-muted)]">{t.loading}</p>
          )}
          {error && <p className="px-1 text-sm text-red-600 mb-2">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="px-1 text-sm text-[var(--shell-muted)]">{t.noPracticeHistory}</p>
          )}
          <ul className="space-y-2">
            {items.map((item) => {
              const active = selectedHistoryId === item.id;
              return (
                <li key={item.id}>
                  <div
                    className={`rounded-2xl border px-3 py-3 transition ${
                      active
                        ? 'border-[var(--shell-list-selected-border)] bg-[var(--shell-list-selected)] shadow-sm'
                        : 'border-transparent hover:bg-[var(--shell-list-hover)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectHistory(item.id)}
                      className="w-full text-left"
                    >
                      <p className="line-clamp-2 text-sm font-medium">
                        {item.jd_title || item.detected_role || 'Untitled JD'}
                      </p>
                      <p className="text-[11px] text-[var(--shell-subtle)] mt-1.5">
                        {item.recommendation_count} {t.practiceProblems}
                        {item.primary_category ? ` · ${item.primary_category}` : ''}
                      </p>
                      <p className="text-[11px] text-[var(--shell-subtle)] mt-0.5">
                        {formatTime(item.updated_at || item.created_at)}
                      </p>
                    </button>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        className="text-[11px] text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === item.id ? t.deleting : t.delete}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
