'use client';

import { useObject } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useAppLanguage } from '@/lib/app-language';
import {
  AnalyzedPdfTemplateSchema,
  createPdfCustomTemplate,
  deleteCustomTemplate,
  listCustomTemplates,
  normalizeLayout,
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

  const refresh = () => setItems(listCustomTemplates());

  useEffect(() => {
    refresh();
  }, []);

  const { submit: analyze, isLoading: analyzing, clear: clearAnalyze } = useObject({
    api: '/api/analyze-resume-template',
    schema: AnalyzedPdfTemplateSchema,
    onFinish: ({ object: finished, error: finishError }) => {
      const id = enrichIdRef.current;
      enrichIdRef.current = null;
      if (finishError || !finished || !id) return;
      const parsed = AnalyzedPdfTemplateSchema.safeParse(finished);
      if (!parsed.success) return;

      const existing = listCustomTemplates().find((x) => x.id === id);
      if (!existing) return;

      const updated = upsertCustomTemplate({
        ...existing,
        name: parsed.data.name.trim() || existing.name,
        layout: normalizeLayout(parsed.data.layout),
      });
      setItems(updated);
      const current = updated.find((x) => x.id === id);
      if (current && selectedId === id) {
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
    onSelect(tpl);
    if (tpl) onApplyVisuals(tpl);
  };

  const handleDelete = (id: string) => {
    const next = deleteCustomTemplate(id);
    setItems(next);
    if (selectedId === id) onSelect(null);
  };

  const busy = disabled || uploading;

  return (
    <div className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t.customTplTitle}</p>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">{t.customTplHelp}</p>
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
              ? 'border-violet-600 bg-white shadow-sm'
              : 'border-transparent bg-white/70 hover:border-violet-200'
          }`}
        >
          <span className="font-medium text-slate-900">{t.customTplNone}</span>
          <span className="block text-xs text-slate-500 mt-0.5">
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
                  ? 'border-violet-600 bg-white shadow-sm'
                  : 'border-transparent bg-white/70'
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
                  <span className="text-sm font-medium text-slate-900 line-clamp-1">
                    {tpl.name}
                  </span>
                </span>
                <span className="block text-xs text-slate-500 mt-1 line-clamp-1">
                  {tpl.sourceFilename}
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {normalizeLayout(tpl.layout)} · PDF
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

      {items.length === 0 && (
        <p className="text-xs text-slate-500">{t.customTplEmpty}</p>
      )}
    </div>
  );
}
