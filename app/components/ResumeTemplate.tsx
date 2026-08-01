'use client';

import { useEffect, useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import HistoryDrawer from '@/app/components/HistoryDrawer';
import ResumePreview from '@/app/components/ResumePreview';
import { getDeviceId } from '@/lib/device-id';
import { downloadResumePdf } from '@/lib/download-resume-pdf';
import type { ResumeHistoryRecord } from '@/lib/resume-history';
import {
  resumeToPlainText,
  ResumeTemplateSchema,
  sampleResume,
  type ResumeTemplate as ResumeData,
} from '@/lib/resume-template';

const ACCEPTED =
  '.txt,.md,.docx,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return (await file.text()).trim();
  }

  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok || !data.text) {
    throw new Error(data.error || 'Failed to read file');
  }
  return data.text;
}

async function saveResumeHistory(input: {
  resume: ResumeData;
  sourceText: string;
  sourceFilename: string | null;
}): Promise<void> {
  const res = await fetch('/api/resume-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({
      resume: input.resume,
      sourceText: input.sourceText,
      sourceFilename: input.sourceFilename,
    }),
  });

  if (res.status === 503) {
    // Supabase not configured — skip silently in local/demo mode.
    return;
  }

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || 'Failed to save history');
  }
}

export default function ResumeTemplate() {
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSample, setShowSample] = useState(true);
  const [savedResume, setSavedResume] = useState<ResumeData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [savingHistory, setSavingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSourceRef = useRef<{ text: string; filename: string | null }>({
    text: '',
    filename: null,
  });

  const { object, submit, isLoading, error, clear } = useObject({
    api: '/api/format-resume',
    schema: ResumeTemplateSchema,
    onFinish: async ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = ResumeTemplateSchema.safeParse(finished);
      if (!parsed.success) return;

      setSavedResume(parsed.data);
      setSavingHistory(true);
      try {
        await saveResumeHistory({
          resume: parsed.data,
          sourceText: pendingSourceRef.current.text,
          sourceFilename: pendingSourceRef.current.filename,
        });
        setHistoryRefreshKey((n) => n + 1);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to save history');
      } finally {
        setSavingHistory(false);
      }
    },
  });

  useEffect(() => {
    // Ensure device id exists early for history APIs.
    getDeviceId();
  }, []);

  const displayResume =
    (object as Partial<ResumeData> | undefined) ??
    savedResume ??
    (showSample ? sampleResume : undefined);
  const busy = isLoading || extracting;

  const handleFormat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLocalError(null);
    setShowSample(false);
    setSavedResume(null);
    pendingSourceRef.current = { text: trimmed, filename: fileName };
    submit({ resumeText: trimmed });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormat(rawText);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setExtracting(true);
    setLocalError(null);
    setFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      setRawText(text);
      handleFormat(text);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setExtracting(false);
    }
  };

  const handleResetSample = () => {
    clear();
    setRawText('');
    setFileName(null);
    setLocalError(null);
    setShowSample(true);
    setSavedResume(null);
  };

  const handleCopy = async () => {
    if (busy) return;
    try {
      const full = object
        ? ResumeTemplateSchema.parse(object)
        : savedResume ?? sampleResume;
      await navigator.clipboard.writeText(resumeToPlainText(full));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setLocalError('Resume is still incomplete — wait for formatting to finish.');
    }
  };

  const handleDownloadPdf = async () => {
    if (busy || downloading) return;
    const el = document.getElementById('resume-print');
    if (!el) {
      setLocalError('Resume preview not found.');
      return;
    }

    setDownloading(true);
    setLocalError(null);
    try {
      await downloadResumePdf(el, displayResume?.name);
    } catch {
      setLocalError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectHistory = async (id: string) => {
    setLocalError(null);
    try {
      const res = await fetch(`/api/resume-history/${id}`, {
        headers: { 'x-device-id': getDeviceId() },
      });
      const data = (await res.json()) as {
        item?: ResumeHistoryRecord;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load record');
      }

      clear();
      setShowSample(false);
      setSavedResume(data.item.resume_json);
      setRawText(data.item.source_text || '');
      setFileName(data.item.source_filename);
      setHistoryOpen(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load record');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">
              Paste your resume or upload a file — we&apos;ll reorganize it into this English
              template.
            </p>
            {fileName && (
              <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition"
            >
              History
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {extracting ? 'Reading file...' : 'Upload file'}
            </button>
            <button
              type="button"
              onClick={handleResetSample}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Reset sample
            </button>
          </div>
        </div>

        <textarea
          className="w-full h-40 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition border-gray-300 text-sm"
          placeholder="Paste resume content here (Chinese or English)..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={busy}
        />

        <button
          type="submit"
          disabled={busy || !rawText.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50 transition shadow"
        >
          {isLoading
            ? 'Formatting resume...'
            : savingHistory
              ? 'Saving to history...'
              : 'Format into template'}
        </button>

        <p className="text-xs text-gray-500">
          Supports .txt, .md, .docx, .pdf (max 4MB). Formatted resumes are saved to History when
          Supabase is configured.
        </p>

        {(localError || error) && (
          <p className="text-sm text-red-600">
            {localError || 'Something went wrong while formatting. Please try again.'}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-600">
          {showSample && !object && !savedResume
            ? 'Showing sample resume. Paste or upload yours to replace it.'
            : isLoading
              ? 'Streaming formatted resume...'
              : 'Formatted preview'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!displayResume?.name || busy || downloading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {copied ? 'Copied!' : 'Copy as text'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!displayResume?.name || busy || downloading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!displayResume?.name || busy || downloading}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
          >
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <ResumePreview resume={displayResume} />

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectHistory}
        refreshKey={historyRefreshKey}
      />
    </div>
  );
}
