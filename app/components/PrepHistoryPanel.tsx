'use client';

import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/device-id';
import type { InterviewPrepHistoryListItem } from '@/lib/interview-prep-history';

type Props = {
  selectedId?: string | null;
  onSelect: (id: string) => void;
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

function groupByDay(items: InterviewPrepHistoryListItem[]) {
  const groups = new Map<string, InterviewPrepHistoryListItem[]>();
  for (const item of items) {
    const stamp = item.updated_at || item.created_at;
    const day = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date(stamp));
    const list = groups.get(day) ?? [];
    list.push(item);
    groups.set(day, list);
  }
  return [...groups.entries()];
}

export default function PrepHistoryPanel({
  selectedId,
  onSelect,
  refreshKey = 0,
  onNew,
}: Props) {
  const [items, setItems] = useState<InterviewPrepHistoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/interview-prep-history', {
      headers: { 'x-device-id': getDeviceId() },
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          items?: InterviewPrepHistoryListItem[];
          error?: string;
        };
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
      const res = await fetch(`/api/interview-prep-history/${id}`, {
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

  const groups = groupByDay(items);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Prep History</h2>
          <p className="text-xs text-stone-500 mt-0.5">JD, questions & fit analyses</p>
        </div>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="shrink-0 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
          >
            New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading && <p className="px-1 text-sm text-stone-500">Loading…</p>}
        {error && <p className="px-1 text-sm text-red-600 mb-3">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="mx-1 mt-6 rounded-2xl border border-dashed border-stone-200 bg-white/60 px-4 py-8 text-center">
            <p className="text-sm text-stone-500">
              No prep sessions yet. Paste a JD and generate on the right.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {groups.map(([day, dayItems]) => (
            <section key={day}>
              <h3 className="px-1 mb-2 text-xs font-medium text-stone-400">{day}</h3>
              <ul className="space-y-2">
                {dayItems.map((item) => {
                  const active = selectedId === item.id;
                  return (
                    <li key={item.id}>
                      <div
                        className={`rounded-2xl border px-3 py-3 transition ${
                          active
                            ? 'border-stone-900/15 bg-white shadow-sm ring-1 ring-stone-900/5'
                            : 'border-transparent bg-white/70 hover:bg-white hover:border-stone-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(item.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                active ? 'bg-stone-900' : 'bg-stone-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium text-stone-900">
                                {item.jd_title || 'Untitled JD'}
                              </p>
                              <p className="text-[11px] text-stone-400 mt-1.5">
                                {item.question_count} questions
                                {item.has_match
                                  ? ` · fit ${item.fit_score ?? '—'}/100`
                                  : ' · no match'}
                              </p>
                              <p className="text-[11px] text-stone-400 mt-0.5">
                                {formatTime(item.updated_at || item.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="text-[11px] text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {deletingId === item.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
