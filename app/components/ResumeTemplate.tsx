'use client';

import { useEffect, useRef, useState } from 'react';
import { useObject } from '@ai-sdk/react';
import InterviewQuestionDrawer from '@/app/components/InterviewQuestionDrawer';
import ResumePreview from '@/app/components/ResumePreview';
import ResumeThemePicker from '@/app/components/ResumeThemePicker';
import { aiFetch, aiRequestHeaders } from '@/lib/ai-request-headers';
import {
  normalizePdfLayoutProfile,
  resolveLayoutId,
  toBrief,
  upsertCustomTemplate,
  type CustomResumeTemplate,
} from '@/lib/custom-resume-templates';
import { getDeviceId } from '@/lib/device-id';
import { applySourceEditsToResume } from '@/lib/apply-resume-edits';
import {
  coerceResumeForPdf,
  downloadResumePdf,
} from '@/lib/download-resume-pdf';
import type { ResumeHistoryRecord } from '@/lib/resume-history';
import {
  parseInterviewMarkers,
  ResumeInterviewSchema,
  type ResumeInterviewMarker,
} from '@/lib/resume-interview';
import { useAppLanguage } from '@/lib/app-language';
import {
  DEFAULT_RESUME_LANGUAGE,
  getResumeLanguage,
  normalizeResumeLanguage,
  type ResumeLanguageCode,
} from '@/lib/resume-languages';
import {
  normalizeFormattedResume,
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

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File too large (max ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB). Try a text-based PDF, .docx, or .txt.`
    );
  }

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
  interviewMarkers?: ResumeInterviewMarker[];
}): Promise<string | null> {
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
      interviewMarkers: input.interviewMarkers ?? [],
    }),
  });

  if (res.status === 503) {
    // Supabase not configured — skip silently in local/demo mode.
    return null;
  }

  const data = (await res.json()) as { item?: { id?: string }; error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save history');
  }
  return data.item?.id ?? null;
}

async function updateHistoryInterviewMarkers(
  historyId: string,
  interviewMarkers: ResumeInterviewMarker[]
): Promise<void> {
  const res = await fetch(`/api/resume-history/${historyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    },
    body: JSON.stringify({ interviewMarkers }),
  });

  if (res.status === 503) return;

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || 'Failed to save interview markers');
  }
}

type Props = {
  activeHistoryId?: string | null;
  resetKey?: number;
  onHistorySaved?: (id: string | null) => void;
};

export default function ResumeTemplate({
  activeHistoryId = null,
  resetKey = 0,
  onHistorySaved,
}: Props) {
  const { language, t } = useAppLanguage();
  /** Language of the currently displayed resume content (labels / PDF). */
  const [resumeLanguage, setResumeLanguage] =
    useState<ResumeLanguageCode>(language);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSample, setShowSample] = useState(true);
  const [savedResume, setSavedResume] = useState<ResumeData | null>(null);
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
  const historyRecordIdRef = useRef<string | null>(null);
  const skipNextExternalLoadRef = useRef(false);
  const [savingHistory, setSavingHistory] = useState(false);
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
  const [customTemplate, setCustomTemplate] =
    useState<CustomResumeTemplate | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const customTemplateRef = useRef<CustomResumeTemplate | null>(null);
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
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) => setLocalError(err.message || 'Formatting failed'),
    onFinish: async ({ object: finished, error: finishError }) => {
      if (finishError || !finished) return;
      const parsed = ResumeTemplateSchema.safeParse(finished);
      if (!parsed.success) return;

      const resume = normalizeFormattedResume(
        parsed.data,
        pendingSourceRef.current.language
      );
      setSavedResume(resume);
      setResumeLanguage(pendingSourceRef.current.language);
      setSourceSnapshot(pendingSourceRef.current.text);
      setSyncMessage(null);
      setInterviewMarkers([]);
      setActiveMarker(null);
      setInterviewDrawerOpen(false);
      setHistoryRecordId(null);
      setSavingHistory(true);
      try {
        const id = await saveResumeHistory({
          resume,
          sourceText: pendingSourceRef.current.text,
          sourceFilename: pendingSourceRef.current.filename,
          language: pendingSourceRef.current.language,
          interviewMarkers: [],
        });
        setHistoryRecordId(id);
        historyRecordIdRef.current = id;
        skipNextExternalLoadRef.current = true;
        onHistorySaved?.(id);
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
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) =>
      setInterviewFinishError(err.message || 'Failed to generate interview markers'),
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
      const markers = parsed.data.markers.map((marker) => ({
        ...marker,
        // Skill/project markers always anchor to the whole row.
        itemIndex: marker.section === 'experience' ? marker.itemIndex : -1,
      }));
      setInterviewMarkers(markers);

      // Persist Q markers + review links with the current history record.
      void (async () => {
        try {
          const currentHistoryId = historyRecordIdRef.current;
          if (currentHistoryId) {
            await updateHistoryInterviewMarkers(currentHistoryId, markers);
            onHistorySaved?.(currentHistoryId);
          } else {
            const full =
              savedResume ??
              (object
                ? coerceResumeForPdf(object as Partial<ResumeData>)
                : null);
            if (!full) return;
            const id = await saveResumeHistory({
              resume: full,
              sourceText: pendingSourceRef.current.text || rawText,
              sourceFilename: pendingSourceRef.current.filename ?? fileName,
              language: pendingSourceRef.current.language || language,
              interviewMarkers: markers,
            });
            setHistoryRecordId(id);
            historyRecordIdRef.current = id;
            skipNextExternalLoadRef.current = true;
            onHistorySaved?.(id);
          }
        } catch (err) {
          setLocalError(
            err instanceof Error ? err.message : 'Failed to save interview markers'
          );
        }
      })();
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

  useEffect(() => {
    historyRecordIdRef.current = historyRecordId;
  }, [historyRecordId]);

  useEffect(() => {
    pendingSourceRef.current.language = language;
    // Sample preview follows the UI language; saved/history content keeps its own.
    if (showSample && !savedResume) {
      setResumeLanguage(language);
    }
  }, [language, showSample, savedResume]);

  useEffect(() => {
    customTemplateRef.current = customTemplate;
  }, [customTemplate]);

  const applyTemplateVisuals = (tpl: CustomResumeTemplate) => {
    const profile = normalizePdfLayoutProfile(tpl.layoutProfile);
    const preset = getColorPreset(tpl.colorPresetId);
    setLayout(resolveLayoutId(tpl.layout, profile));
    setColorPresetId(tpl.colorPresetId || DEFAULT_COLOR_PRESET_ID);
    setBackground(
      tpl.background?.trim() ||
        profile?.backgroundHint ||
        preset.background
    );
    setAccent(
      tpl.accent?.trim() || profile?.accentHint || preset.accent
    );
  };

  const activeLayoutProfile = customTemplate
    ? normalizePdfLayoutProfile(customTemplate.layoutProfile)
    : null;

  const handleLayoutChange = (next: ResumeLayoutId) => {
    setLayout(next);
  };

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
    setHistoryRecordId(null);
    historyRecordIdRef.current = null;
    clearInterview();
    pendingSourceRef.current = {
      text: trimmed,
      filename: fileName,
      language,
    };
    setResumeLanguage(language);
    const tpl = customTemplateRef.current;
    submit({
      resumeText: trimmed,
      language,
      customTemplate: tpl ? toBrief(tpl) : null,
    });
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
      language: resumeLanguage,
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
      interviewMarkers,
    })
      .then((id) => {
        setHistoryRecordId(id);
        historyRecordIdRef.current = id;
        skipNextExternalLoadRef.current = true;
        onHistorySaved?.(id);
      })
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
    setResumeLanguage(language);
    setSourceSnapshot('');
    setInterviewMarkers([]);
    setActiveMarker(null);
    setInterviewDrawerOpen(false);
    setHistoryRecordId(null);
    historyRecordIdRef.current = null;
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
        language: resumeLanguage,
        personName: full.name,
        previewElement: document.getElementById('resume-print'),
        layoutProfile: activeLayoutProfile,
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
      const historyLanguage = normalizeResumeLanguage(data.item.language);
      setResumeLanguage(historyLanguage);
      setSavedResume(
        normalizeFormattedResume(data.item.resume_json, historyLanguage)
      );
      setRawText(data.item.source_text || '');
      setSourceSnapshot(data.item.source_text || '');
      setFileName(data.item.source_filename);
      setSyncMessage(null);
      const markers = parseInterviewMarkers(data.item.interview_markers_json);
      setInterviewMarkers(markers);
      setActiveMarker(null);
      setInterviewDrawerOpen(false);
      setHistoryRecordId(data.item.id);
      historyRecordIdRef.current = data.item.id;
      clearInterview();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load record');
    }
  };

  useEffect(() => {
    if (!activeHistoryId) return;
    if (skipNextExternalLoadRef.current) {
      skipNextExternalLoadRef.current = false;
      return;
    }
    if (activeHistoryId === historyRecordIdRef.current) return;
    void handleSelectHistory(activeHistoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when middle panel selection changes
  }, [activeHistoryId]);

  useEffect(() => {
    if (resetKey === 0) return;
    handleResetSample();
    skipNextExternalLoadRef.current = true;
    onHistorySaved?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 print:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
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
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {extracting ? t.extracting : t.uploadFile}
            </button>
            <button
              type="button"
              onClick={handleResetSample}
              disabled={busy}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {t.resetSample}
            </button>
          </div>
          <p className="text-sm text-[var(--shell-muted)]">{t.resumeHelp}</p>
          {fileName && (
            <p className="text-xs text-[var(--shell-subtle)]">Loaded: {fileName}</p>
          )}
        </div>

        <textarea
          className="h-44 w-full rounded-xl border border-gray-300 p-4 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t.pasteResume}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={busy}
        />

        <button
          type="submit"
          disabled={busy || !rawText.trim()}
          className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading
            ? `${t.formatting} (${getResumeLanguage(language).label})`
            : savingHistory
              ? t.savingHistory
              : customTemplate
                ? `${t.formatAiWithTpl} (${getResumeLanguage(language).label})`
                : `${t.formatAi} (${getResumeLanguage(language).label})`}
        </button>

        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <p className="mr-auto text-xs text-[var(--shell-subtle)]">{t.syncHint}</p>
          <button
            type="button"
            onClick={handleApplyEdits}
            disabled={!canSyncEdits}
            className="text-sm font-medium text-[var(--shell-muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            {t.syncEdits}
          </button>
        </div>

        {syncMessage && (
          <p className="text-right text-sm text-green-700">{syncMessage}</p>
        )}

        <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-card)]">
          <button
            type="button"
            onClick={() => setAppearanceOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={appearanceOpen}
          >
            <span className="text-sm font-medium text-[var(--foreground)]">
              {t.templateAppearance}
              {customTemplate ? (
                <span className="ml-2 text-xs font-normal text-violet-700 dark:text-violet-300">
                  · {customTemplate.name}
                </span>
              ) : (
                <span className="ml-2 text-xs font-normal text-[var(--shell-muted)]">
                  · {layout}
                </span>
              )}
            </span>
            <span className="text-xs text-[var(--shell-muted)]">
              {appearanceOpen ? '−' : '+'}
            </span>
          </button>
          {appearanceOpen && (
            <div className="border-t border-[var(--shell-border)] px-4 py-4">
              <ResumeThemePicker
                layout={layout}
                colorPresetId={colorPresetId}
                background={background}
                accent={accent}
                language={language}
                selectedCustomId={customTemplate?.id ?? null}
                disabled={busy}
                onLayoutChange={handleLayoutChange}
                onSelectCustom={setCustomTemplate}
                onApplyCustomVisuals={applyTemplateVisuals}
                onColorPresetChange={(presetId) => {
                  const preset = getColorPreset(presetId);
                  setColorPresetId(presetId);
                  setBackground(preset.background);
                  setAccent(preset.accent);
                  if (customTemplate) {
                    const updated: CustomResumeTemplate = {
                      ...customTemplate,
                      colorPresetId: presetId,
                      background: preset.background,
                      accent: preset.accent,
                    };
                    upsertCustomTemplate(updated);
                    setCustomTemplate(updated);
                  }
                }}
                onBackgroundChange={(color) => {
                  setBackground(color);
                  if (customTemplate) {
                    const updated: CustomResumeTemplate = {
                      ...customTemplate,
                      background: color,
                    };
                    upsertCustomTemplate(updated);
                    setCustomTemplate(updated);
                  }
                }}
                onAccentChange={(color) => {
                  setAccent(color);
                  if (customTemplate) {
                    const updated: CustomResumeTemplate = {
                      ...customTemplate,
                      accent: color,
                    };
                    upsertCustomTemplate(updated);
                    setCustomTemplate(updated);
                  }
                }}
              />
            </div>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
        <p className="mr-auto text-sm text-[var(--shell-muted)]">
          {showSample && !object && !savedResume
            ? 'Showing sample resume. Paste or upload yours to replace it.'
            : isLoading
              ? 'Streaming formatted resume...'
              : t.previewLabel}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleGenerateInterview}
            disabled={!hasGeneratedResume || busy || downloading}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {interviewLoading ? t.generatingMarkers : t.interviewMarkers}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!displayResume?.name || busy || downloading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {downloading ? t.generatingPdf : t.downloadPdf}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!displayResume?.name || busy || downloading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {copied ? t.copied : t.copyText}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!displayResume?.name || busy || downloading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {t.print}
          </button>
        </div>
      </div>

      {liveMarkers.length > 0 && (
        <p className="text-xs text-indigo-700 print:hidden">
          Circled numbers mark interview hotspots. Click a number for questions &
          suggested answers. These markers are hidden in Print / PDF export.
        </p>
      )}

      {(localError || error || interviewError || interviewFinishError) && (
        <p className="text-sm text-red-600 print:hidden">
          {localError ||
            interviewFinishError ||
            interviewError?.message ||
            error?.message ||
            'Something went wrong while formatting. Please try again.'}
        </p>
      )}

      <ResumePreview
        resume={displayResume}
        language={resumeLanguage}
        layout={layout}
        colorPresetId={colorPresetId}
        background={background}
        accent={accent}
        layoutProfile={activeLayoutProfile}
        markers={liveMarkers}
        onMarkerClick={(marker) => {
          setActiveMarker(marker);
          setInterviewDrawerOpen(true);
        }}
      />

      <InterviewQuestionDrawer
        open={interviewDrawerOpen}
        marker={activeMarker}
        onClose={() => setInterviewDrawerOpen(false)}
      />
    </div>
  );
}
