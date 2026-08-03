'use client';

import { useObject } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { aiFetch, aiRequestHeaders } from '@/lib/ai-request-headers';
import { useAppLanguage } from '@/lib/app-language';
import {
  AnalyzedPdfTemplateSchema,
  createPdfCustomTemplate,
  deleteCustomTemplate,
  getSelectedCustomTemplateId,
  listCustomTemplates,
  mergeAnalyzedIntoTemplate,
  normalizeLayout,
  normalizePdfLayoutProfile,
  setSelectedCustomTemplateId,
  upsertCustomTemplate,
  type CustomResumeTemplate,
} from '@/lib/custom-resume-templates';
import {
  getColorPreset,
  RESUME_COLOR_PRESETS,
  RESUME_LAYOUTS,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

type Props = {
  layout: ResumeLayoutId;
  colorPresetId: string;
  background: string;
  accent: string;
  language: string;
  selectedCustomId: string | null;
  disabled?: boolean;
  onLayoutChange: (layout: ResumeLayoutId) => void;
  onSelectCustom: (template: CustomResumeTemplate | null) => void;
  onApplyCustomVisuals: (template: CustomResumeTemplate) => void;
  onColorPresetChange: (presetId: string) => void;
  onBackgroundChange: (color: string) => void;
  onAccentChange: (color: string) => void;
};

async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok || !data.text) {
    throw new Error(data.error || 'Failed to read PDF');
  }
  return data.text;
}

export default function ResumeThemePicker({
  layout,
  colorPresetId,
  background,
  accent,
  language,
  selectedCustomId,
  disabled,
  onLayoutChange,
  onSelectCustom,
  onApplyCustomVisuals,
  onColorPresetChange,
  onBackgroundChange,
  onAccentChange,
}: Props) {
  const { t } = useAppLanguage();
  const [items, setItems] = useState<CustomResumeTemplate[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(true);
  const enrichIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    setItems(listCustomTemplates());
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const id = getSelectedCustomTemplateId();
    if (!id) return;
    const found = listCustomTemplates().find((x) => x.id === id);
    if (!found) {
      setSelectedCustomTemplateId(null);
      return;
    }
    onSelectCustom(found);
    onApplyCustomVisuals(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once
  }, []);

  const { submit: analyze, isLoading: analyzing, clear: clearAnalyze } = useObject({
    api: '/api/analyze-resume-template',
    schema: AnalyzedPdfTemplateSchema,
    headers: aiRequestHeaders,
    fetch: aiFetch,
    onError: (err) => setLocalError(err.message || t.customTplUploadFail),
    onFinish: ({ object: finished, error: finishError }) => {
      const id = enrichIdRef.current;
      enrichIdRef.current = null;
      if (finishError || !finished || !id) return;
      const parsed = AnalyzedPdfTemplateSchema.safeParse(finished);
      if (!parsed.success) return;
      const existing = listCustomTemplates().find((x) => x.id === id);
      if (!existing) return;
      const merged = mergeAnalyzedIntoTemplate(existing, parsed.data);
      const updated = upsertCustomTemplate(merged);
      setItems(updated);
      const current = updated.find((x) => x.id === id);
      if (current) {
        setSelectedCustomTemplateId(current.id);
        onSelectCustom(current);
        onApplyCustomVisuals(current);
      }
    },
  });

  const busy = Boolean(disabled || uploading);

  const selectBuiltIn = (id: ResumeLayoutId) => {
    setSelectedCustomTemplateId(null);
    onSelectCustom(null);
    onLayoutChange(id);
  };

  const selectCustom = (tpl: CustomResumeTemplate) => {
    setSelectedCustomTemplateId(tpl.id);
    onSelectCustom(tpl);
    onApplyCustomVisuals(tpl);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && file.type !== 'application/pdf') {
      setLocalError(t.customTplPdfOnly);
      return;
    }
    setLocalError(null);
    setUploading(true);
    clearAnalyze();
    enrichIdRef.current = null;
    try {
      const text = await extractPdfText(file);
      const baseName = file.name.replace(/\.pdf$/i, '') || t.customTplNewName;
      const draft = createPdfCustomTemplate({
        name: baseName,
        sourceFilename: file.name,
        templateText: text,
      });
      const saved = upsertCustomTemplate(draft);
      setItems(saved);
      const current = saved.find((x) => x.id === draft.id) ?? draft;
      selectCustom(current);
      enrichIdRef.current = current.id;
      analyze({
        templateText: text,
        filename: file.name,
        language,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t.customTplUploadFail);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    const next = deleteCustomTemplate(id);
    setItems(next);
    if (selectedCustomId === id) {
      setSelectedCustomTemplateId(null);
      onSelectCustom(null);
    }
  };

  const selectedCustom = items.find((x) => x.id === selectedCustomId) ?? null;

  return (
    <div className="space-y-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {t.resumeTemplateLabel}
        </p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-[var(--shell-border)] px-2.5 py-1 text-xs font-medium text-[var(--shell-muted)] hover:bg-[var(--shell-hover)] disabled:opacity-50"
          >
            {uploading
              ? t.customTplUploading
              : analyzing
                ? t.customTplAnalyzing
                : t.customTplUploadPdf}
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--shell-muted)]">{t.resumeTemplateHint}</p>

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {RESUME_LAYOUTS.map((item) => {
          const active = !selectedCustomId && layout === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              onClick={() => selectBuiltIn(item.id)}
              className={`text-left rounded-xl border px-3 py-2.5 transition disabled:opacity-50 ${
                active
                  ? 'border-blue-600 bg-[var(--shell-active)] shadow-sm'
                  : 'border-[var(--shell-border)] hover:bg-[var(--shell-hover)]'
              }`}
            >
              <span className="block text-sm font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--shell-muted)]">
                {item.description}
              </span>
            </button>
          );
        })}

        {items.map((tpl) => {
          const active = selectedCustomId === tpl.id;
          const preset = getColorPreset(tpl.colorPresetId);
          return (
            <div
              key={tpl.id}
              className={`rounded-xl border px-3 py-2.5 ${
                active
                  ? 'border-violet-600 bg-[var(--shell-active)] shadow-sm'
                  : 'border-[var(--shell-border)]'
              }`}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => selectCustom(tpl)}
                className="w-full text-left disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ background: preset.accent }}
                  />
                  <span className="line-clamp-1 text-sm font-medium text-[var(--foreground)]">
                    {tpl.name}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--shell-subtle)]">
                  PDF ·{' '}
                  {normalizePdfLayoutProfile(tpl.layoutProfile)?.columns ??
                    normalizeLayout(tpl.layout)}
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(tpl.id)}
                className="mt-1.5 text-[11px] text-red-600 hover:underline disabled:opacity-50"
              >
                {t.delete}
              </button>
            </div>
          );
        })}
      </div>

      {selectedCustom && (
        <p className="text-xs text-violet-800 dark:text-violet-200">
          {t.customTplApplyHint}
          {!normalizePdfLayoutProfile(selectedCustom.layoutProfile) && (
            <span className="mt-0.5 block">
              {analyzing ? t.customTplAnalyzing : t.customTplProfilePending}
            </span>
          )}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setColorsOpen((v) => !v)}
          className="text-xs font-medium text-[var(--shell-muted)] hover:text-[var(--foreground)]"
          aria-expanded={colorsOpen}
        >
          {colorsOpen ? t.hideColors : t.showColors}
        </button>

        {colorsOpen && (
          <div className="space-y-3">
            <div className="flex flex-wrap justify-start gap-2">
              {RESUME_COLOR_PRESETS.map((preset) => {
                const active = colorPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    onClick={() => onColorPresetChange(preset.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-[var(--foreground)] transition ${
                      active
                        ? 'border-blue-600 bg-[var(--shell-active)]'
                        : 'border-[var(--shell-border)] hover:bg-[var(--shell-hover)]'
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-black/10"
                      style={{ background: preset.accent }}
                    />
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-start gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
                <span>Background</span>
                <input
                  type="color"
                  value={background}
                  onChange={(e) => onBackgroundChange(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-[var(--shell-border)] bg-[var(--shell-input)]"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
                <span>Accent</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => onAccentChange(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-[var(--shell-border)] bg-[var(--shell-input)]"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
