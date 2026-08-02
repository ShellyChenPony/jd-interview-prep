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
import { getColorPreset } from '@/lib/resume-themes';

type Props = {
  selectedId: string | null;
  language: string;
  disabled?: boolean;
  onSelect: (template: CustomResumeTemplate | null) => void;
  onApplyVisuals: (template: CustomResumeTemplate) => void;
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

export default function CustomResumeTemplatePanel({
  selectedId,
  language,
  disabled,
  onSelect,
  onApplyVisuals,
}: Props) {
  const { t } = useAppLanguage();
  const [items, setItems] = useState<CustomResumeTemplate[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const enrichIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  const refresh = () => setItems(listCustomTemplates());

  useEffect(() => {
    refresh();
  }, []);

  // Restore last selected PDF template once on mount.
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
    onSelect(found);
    onApplyVisuals(found);
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
      // Always apply analysis result for the template we just enriched.
      if (current) {
        setSelectedCustomTemplateId(current.id);
        onSelect(current);
        onApplyVisuals(current);
      }
    },
  });

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
      setSelectedCustomTemplateId(current.id);
      onSelect(current);
      onApplyVisuals(current);

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

  const selectTemplate = (tpl: CustomResumeTemplate | null) => {
    setSelectedCustomTemplateId(tpl?.id ?? null);
    onSelect(tpl);
    if (tpl) onApplyVisuals(tpl);
  };

  const handleDelete = (id: string) => {
    const next = deleteCustomTemplate(id);
    setItems(next);
    if (selectedId === id) {
      setSelectedCustomTemplateId(null);
      onSelect(null);
    }
  };

  const busy = disabled || uploading;
  const selected = items.find((x) => x.id === selectedId) ?? null;

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/30 bg-[var(--shell-card)] p-4 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {t.customTplTitle}
          </p>
          <p className="text-xs text-[var(--shell-muted)] mt-1 max-w-xl">
            {t.customTplHelp}
          </p>
        </div>
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
            className="rounded-xl bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {uploading
              ? t.customTplUploading
              : analyzing
                ? t.customTplAnalyzing
                : t.customTplUploadPdf}
          </button>
        </div>
      </div>

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => selectTemplate(null)}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
            !selectedId
              ? 'border-violet-600 bg-[var(--shell-active)] shadow-sm'
              : 'border-[var(--shell-border)] bg-[var(--shell-input)] hover:border-violet-400/50'
          }`}
        >
          <span className="font-medium text-[var(--foreground)]">
            {t.customTplNone}
          </span>
          <span className="block text-xs text-[var(--shell-muted)] mt-0.5">
            {t.customTplNoneHint}
          </span>
        </button>

        {items.map((tpl) => {
          const active = selectedId === tpl.id;
          const preset = getColorPreset(tpl.colorPresetId);
          return (
            <div
              key={tpl.id}
              className={`min-w-[170px] max-w-[240px] rounded-xl border px-3 py-2 ${
                active
                  ? 'border-violet-600 bg-[var(--shell-active)] shadow-sm'
                  : 'border-[var(--shell-border)] bg-[var(--shell-input)]'
              }`}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => selectTemplate(tpl)}
                className="w-full text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-black/10"
                    style={{ background: preset.accent }}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                    {tpl.name}
                  </span>
                </span>
                <span className="block text-xs text-[var(--shell-muted)] mt-1 line-clamp-1">
                  {tpl.sourceFilename}
                </span>
                <span className="block text-[11px] text-[var(--shell-subtle)] mt-0.5">
                  {normalizePdfLayoutProfile(tpl.layoutProfile)?.columns ??
                    normalizeLayout(tpl.layout)}{' '}
                  · PDF layout
                </span>
              </button>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(tpl.id)}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedId && (
        <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-900 dark:text-violet-100">
          {t.customTplApplyHint}
          {selected && !normalizePdfLayoutProfile(selected.layoutProfile) && (
            <span className="mt-1 block opacity-90">
              {analyzing ? t.customTplAnalyzing : t.customTplProfilePending}
            </span>
          )}
        </p>
      )}

      {selected?.styleNotes && (
        <div className="rounded-lg border border-[var(--shell-border)] bg-[var(--shell-input)] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--shell-subtle)]">
            {t.customTplStyleNotes}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--shell-muted)]">
            {selected.styleNotes}
          </p>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-[var(--shell-muted)]">{t.customTplEmpty}</p>
      )}
    </div>
  );
}
