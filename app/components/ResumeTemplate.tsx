'use client';

import { useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import ResumePreview from '@/app/components/ResumePreview';
import { downloadResumePdf } from '@/lib/download-resume-pdf';
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

  // .docx / .pdf (and fallback) via server extraction
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok || !data.text) {
    throw new Error(data.error || 'Failed to read file');
  }
  return data.text;
}

export default function ResumeTemplate() {
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSample, setShowSample] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { object, submit, isLoading, error, clear } = useObject({
    api: '/api/format-resume',
    schema: ResumeTemplateSchema,
  });

  const displayResume = (object as Partial<ResumeData> | undefined) ?? (showSample ? sampleResume : undefined);
  const busy = isLoading || extracting;

  const handleFormat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLocalError(null);
    setShowSample(false);
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
  };

  const handleCopy = async () => {
    if (busy) return;
    try {
      const full = object
        ? ResumeTemplateSchema.parse(object)
        : sampleResume;
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
          {isLoading ? 'Formatting resume...' : 'Format into template'}
        </button>

        <p className="text-xs text-gray-500">
          Supports .txt, .md, .docx, .pdf (max 5MB). Facts are preserved; wording is polished into
          professional English.
        </p>

        {(localError || error) && (
          <p className="text-sm text-red-600">
            {localError || 'Something went wrong while formatting. Please try again.'}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-600">
          {showSample && !object
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
    </div>
  );
}
