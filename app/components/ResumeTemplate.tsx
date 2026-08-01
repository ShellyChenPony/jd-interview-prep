'use client';

import { useEffect, useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import HistoryDrawer from '@/app/components/HistoryDrawer';
import InterviewQuestionDrawer from '@/app/components/InterviewQuestionDrawer';
import ResumePreview from '@/app/components/ResumePreview';
import ResumeThemePicker from '@/app/components/ResumeThemePicker';
import { getDeviceId } from '@/lib/device-id';
import { applySourceEditsToResume } from '@/lib/apply-resume-edits';
import {
  coerceResumeForPdf,
  downloadResumePdf,
} from '@/lib/download-resume-pdf';
import type { ResumeHistoryRecord } from '@/lib/resume-history';
import {
  ResumeInterviewSchema,
  type ResumeInterviewMarker,
} from '@/lib/resume-interview';
import {
  DEFAULT_RESUME_LANGUAGE,
  getResumeLanguage,
  isResumeLanguageCode,
  RESUME_LANGUAGES,
  type ResumeLanguageCode,
} from '@/lib/resume-languages';
import {
  resumeToPlainText,
  ResumeTemplateSchema,
  sampleResume,
  type ResumeTemplate as ResumeData,
} from '@/lib/resume-template';
import {
  buildResumeTheme,
  DEFAULT_COLOR_PRESET_ID,
  DEFAULT_RESUME_LAYOUT,
  getColorPreset,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

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
  language: ResumeLanguageCode;
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
      language: input.language,
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
  const [language, setLanguage] = useState<ResumeLanguageCode>(DEFAULT_RESUME_LANGUAGE);
  const [sourceSnapshot, setSourceSnapshot] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [layout, setLayout] = useState<ResumeLayoutId>(DEFAULT_RESUME_LAYOUT);
  const [colorPresetId, setColorPresetId] = useState(DEFAULT_COLOR_PRESET_ID);
  const [background, setBackground] = useState(
    () => getColorPreset(DEFAULT_COLOR_PRESET_ID).background
  );
  const [accent, setAccent] = useState(
    () => getColorPreset(DEFAULT_COLOR_PRESET_ID).accent
  );
  const [interviewMarkers, setInterviewMarkers] = useState<ResumeInterviewMarker[]>(
    []
  );
  const [activeMarker, setActiveMarker] = useState<ResumeInterviewMarker | null>(null);
  const [interviewDrawerOpen, setInterviewDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSourceRef = useRef<{
    text: string;
    filename: string | null;
    language: ResumeLanguageCode;
  }>({
    text: '',
    filename: null,
    language: DEFAULT_RESUME_LANGUAGE,
  });

  const { object, submit, isLoading, error, clear } = useObject({
    api: '/api/format-resume',
    schema: ResumeTemplateSchema,
    onFinish: async ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = ResumeTemplateSchema.safeParse(finished);
      if (!parsed.success) return;

      setSavedResume(parsed.data);
      setSourceSnapshot(pendingSourceRef.current.text);
      setSyncMessage(null);
      setInterviewMarkers([]);
      setActiveMarker(null);
      setInterviewDrawerOpen(false);
      setSavingHistory(true);
      try {
        await saveResumeHistory({
          resume: parsed.data,
          sourceText: pendingSourceRef.current.text,
          sourceFilename: pendingSourceRef.current.filename,
          language: pendingSourceRef.current.language,
        });
        setHistoryRefreshKey((n) => n + 1);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to save history');
      } finally {
        setSavingHistory(false);
      }
    },
  });

  const [interviewFinishError, setInterviewFinishError] = useState<string | null>(
    null
  );

  const {
    object: interviewObject,
    submit: submitInterview,
    isLoading: interviewLoading,
    error: interviewError,
    clear: clearInterview,
  } = useObject({
    api: '/api/resume-interview',
    schema: ResumeInterviewSchema,
    onFinish: ({ object: finished, error: finishError }) => {
      if (finishError || !finished?.markers?.length) {
        setInterviewFinishError(
          finishError?.message ||
            'No interview markers were returned. Please try again.'
        );
        return;
      }
      const parsed = ResumeInterviewSchema.safeParse(finished);
      if (!parsed.success) {
        setInterviewFinishError('Interview markers response was incomplete.');
        return;
      }
      setInterviewFinishError(null);
      setInterviewMarkers(
        parsed.data.markers.map((marker) => ({
          ...marker,
          // Skill/project markers always anchor to the whole row.
          itemIndex:
            marker.section === 'experience' ? marker.itemIndex : -1,
        }))
      );
    },
  });

  const liveMarkers =
    interviewMarkers.length > 0
      ? interviewMarkers
      : ((interviewObject?.markers ?? []).filter(
          (m): m is ResumeInterviewMarker =>
            Boolean(m && typeof m.id === 'number' && m.section)
        ) as ResumeInterviewMarker[]);

  useEffect(() => {
    // Ensure device id exists early for history APIs.
    getDeviceId();
  }, []);

  const streamed = object as Partial<ResumeData> | undefined;
  const hasStreamedContent = Boolean(
    streamed?.name || streamed?.summary || (streamed?.experience && streamed.experience.length > 0)
  );
  // Prefer locally edited/saved resume over stale stream once formatting finished.
  const displayResume = savedResume
    ? savedResume
    : hasStreamedContent
      ? streamed
      : showSample
        ? sampleResume
        : undefined;
  const busy = isLoading || extracting || interviewLoading;
  const hasGeneratedResume = Boolean(savedResume || (hasStreamedContent && !isLoading));
  const canSyncEdits =
    hasGeneratedResume &&
    Boolean(sourceSnapshot.trim()) &&
    rawText.trim() !== sourceSnapshot.trim() &&
    !busy;

  const resolveFullResume = (): ResumeData | null => {
    if (savedResume) return savedResume;
    if (hasStreamedContent && streamed) {
      return coerceResumeForPdf(streamed);
    }
    if (showSample) return sampleResume;
    return null;
  };

  const handleFormat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLocalError(null);
    setSyncMessage(null);
    setShowSample(false);
    setSavedResume(null);
    setSourceSnapshot('');
    setInterviewMarkers([]);
    setActiveMarker(null);
    setInterviewDrawerOpen(false);
    clearInterview();
    pendingSourceRef.current = {
      text: trimmed,
      filename: fileName,
      language,
    };
    submit({ resumeText: trimmed, language });
  };

  const handleGenerateInterview = () => {
    const full = resolveFullResume();
    if (!full || (!savedResume && !hasStreamedContent && showSample)) {
      setLocalError('请先生成简历，再生成面试题标记。');
      return;
    }
    setLocalError(null);
    setInterviewFinishError(null);
    const previousAnchors = interviewMarkers
      .map((marker) => marker.anchorText)
      .filter(Boolean)
      .slice(0, 24);
    setInterviewMarkers([]);
    setActiveMarker(null);
    setInterviewDrawerOpen(false);
    submitInterview({
      resume: full,
      language,
      // Help the model avoid repeating the same lines/questions on regenerate.
      previousAnchors,
    });
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
    setSyncMessage(null);
    setFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      // Step 1 only: extract into textarea. User can edit, then Format (AI) once.
      setRawText(text);
      setShowSample(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setExtracting(false);
    }
  };

  const handleApplyEdits = () => {
    const current = resolveFullResume();
    if (!current || (!savedResume && !hasStreamedContent)) {
      setLocalError('请先生成一份简历，再同步修改。');
      return;
    }
    if (!sourceSnapshot.trim()) {
      setLocalError('缺少生成时的原文快照，请先重新 Format 一次。');
      return;
    }

    const nextSource = rawText.trim();
    if (!nextSource) {
      setLocalError('文本框不能为空。');
      return;
    }
    if (nextSource === sourceSnapshot.trim()) {
      setSyncMessage('文本没有变化。');
      return;
    }

    const { resume: updated, replacements, hits } = applySourceEditsToResume(
      current,
      sourceSnapshot,
      nextSource
    );

    if (replacements.length === 0) {
      setLocalError('未能识别可同步的文字改动。可改姓名/电话/公司名等，或重新 Format。');
      setSyncMessage(null);
      return;
    }
    if (hits === 0) {
      setLocalError(
        '已检测到文本改动，但生成稿中找不到对应原文（可能已被 AI 翻译改写）。姓名/电话/公司名通常可同步；大段重写请重新 Format。'
      );
      setSyncMessage(null);
      return;
    }

    clear();
    setSavedResume(updated);
    setSourceSnapshot(nextSource);
    setShowSample(false);
    setLocalError(null);
    setSyncMessage(`已同步 ${hits} 处修改到简历（未调用 AI）。`);

    // Persist the lightly-edited version without another AI call.
    void saveResumeHistory({
      resume: updated,
      sourceText: nextSource,
      sourceFilename: fileName,
      language,
    })
      .then(() => setHistoryRefreshKey((n) => n + 1))
      .catch(() => {
        // Keep local sync even if history save fails.
      });
  };

  const handleResetSample = () => {
    clear();
    setRawText('');
    setFileName(null);
    setLocalError(null);
    setSyncMessage(null);
    setShowSample(true);
    setSavedResume(null);
    setSourceSnapshot('');
    setInterviewMarkers([]);
    setActiveMarker(null);
    setInterviewDrawerOpen(false);
    clearInterview();
  };

  const handleCopy = async () => {
    if (busy) return;
    const full = resolveFullResume();
    if (!full) {
      setLocalError('Resume is still incomplete — wait for formatting to finish.');
      return;
    }
    await navigator.clipboard.writeText(resumeToPlainText(full));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (busy || downloading) return;
    const full = resolveFullResume();
    if (!full) {
      setLocalError('Resume is incomplete — wait for formatting to finish, or open one from History.');
      return;
    }

    setDownloading(true);
    setLocalError(null);
    try {
      await downloadResumePdf({
        resume: full,
        language,
        personName: full.name,
        previewElement: document.getElementById('resume-print'),
        theme: buildResumeTheme({
          layout,
          presetId: colorPresetId,
          background,
          accent,
        }),
      });
    } catch (err) {
      console.error('[download-pdf]', err);
      const detail = err instanceof Error ? err.message : 'Unknown error';
      setLocalError(`Failed to generate PDF: ${detail}`);
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
      setSourceSnapshot(data.item.source_text || '');
      setFileName(data.item.source_filename);
      setSyncMessage(null);
      setInterviewMarkers([]);
      setActiveMarker(null);
      setInterviewDrawerOpen(false);
      clearInterview();
      if (isResumeLanguageCode(data.item.language)) {
        setLanguage(data.item.language);
      }
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
              Upload/paste first (edit freely), then Format once with AI. Small text fixes can sync
              into the generated resume without another AI call.
            </p>
            {fileName && (
              <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span className="whitespace-nowrap">Language</span>
              <select
                value={language}
                disabled={busy}
                onChange={(e) => setLanguage(e.target.value as ResumeLanguageCode)}
                className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm disabled:opacity-50"
              >
                {RESUME_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </label>
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
              {extracting ? 'Extracting text...' : 'Upload file'}
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

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={busy || !rawText.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50 transition shadow"
          >
            {isLoading
              ? `Formatting in ${getResumeLanguage(language).label}...`
              : savingHistory
                ? 'Saving to history...'
                : `Format with AI (${getResumeLanguage(language).label})`}
          </button>
          <button
            type="button"
            onClick={handleApplyEdits}
            disabled={!canSyncEdits}
            className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-xl disabled:opacity-50 transition"
          >
            Sync edits to resume (no AI)
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Upload only extracts text into the box. After AI Format, tweak names/phones/companies in
          the text and click Sync — no extra API call. Large rewrites still need Format with AI.
        </p>

        {syncMessage && <p className="text-sm text-green-700">{syncMessage}</p>}

      </form>

      <ResumeThemePicker
        layout={layout}
        colorPresetId={colorPresetId}
        background={background}
        accent={accent}
        onLayoutChange={setLayout}
        onColorPresetChange={(presetId) => {
          const preset = getColorPreset(presetId);
          setColorPresetId(presetId);
          setBackground(preset.background);
          setAccent(preset.accent);
        }}
        onBackgroundChange={setBackground}
        onAccentChange={setAccent}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-600">
          {showSample && !object && !savedResume
            ? 'Showing sample resume. Paste or upload yours to replace it.'
            : isLoading
              ? 'Streaming formatted resume...'
              : 'Formatted preview'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerateInterview}
            disabled={!hasGeneratedResume || busy || downloading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 transition"
          >
            {interviewLoading ? 'Generating Q markers...' : 'Interview markers'}
          </button>
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

      {liveMarkers.length > 0 && (
        <p className="text-xs text-indigo-700 print:hidden">
          Circled numbers mark interview hotspots. Click a number for questions & suggested
          answers. These markers are hidden in Print / PDF export.
        </p>
      )}

      {(localError || error || interviewError || interviewFinishError) && (
        <p className="text-sm text-red-600 print:hidden">
          {localError ||
            interviewFinishError ||
            (interviewError
              ? 'Failed to generate interview markers. Please try again.'
              : 'Something went wrong while formatting. Please try again.')}
        </p>
      )}

      <ResumePreview
        resume={displayResume}
        language={language}
        layout={layout}
        colorPresetId={colorPresetId}
        background={background}
        accent={accent}
        markers={liveMarkers}
        onMarkerClick={(marker) => {
          setActiveMarker(marker);
          setInterviewDrawerOpen(true);
        }}
      />

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectHistory}
        refreshKey={historyRefreshKey}
      />

      <InterviewQuestionDrawer
        open={interviewDrawerOpen}
        marker={activeMarker}
        onClose={() => setInterviewDrawerOpen(false)}
      />
    </div>
  );
}
