'use client';

import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/device-id';
import type { ResumeHistoryListItem } from '@/lib/resume-history';
import { getResumeLanguage } from '@/lib/resume-languages';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  refreshKey?: number;
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

export default function HistoryDrawer({ open, onClose, onSelect, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<ResumeHistoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/resume-history', {
      headers: { 'x-device-id': getDeviceId() },
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          items?: ResumeHistoryListItem[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load history');
        }
        setItems(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/resume-history/${id}`, {
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
    <div
      className={`fixed inset-0 z-50 print:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Resume history"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Previous resume formatting records</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-gray-500">Loading history...</p>}
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-gray-500">
              No saved resumes yet. Format one and it will appear here.
            </p>
          )}

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-gray-200 p-3 hover:border-blue-300 transition"
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="w-full text-left"
                >
                  <p className="font-medium text-gray-900 truncate">
                    {item.name || 'Untitled'}
                  </p>
                  <p className="text-sm text-blue-700 truncate mt-0.5">
                    {item.job_title || 'No title'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatTime(item.created_at)}
                    {` · ${getResumeLanguage(item.language).label}`}
                    {item.source_filename ? ` · ${item.source_filename}` : ''}
                  </p>
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
