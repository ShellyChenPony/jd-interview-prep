'use client';

import {
  RESUME_COLOR_PRESETS,
  RESUME_LAYOUTS,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

type Props = {
  layout: ResumeLayoutId;
  colorPresetId: string;
  background: string;
  accent: string;
  /** When a PDF style template is selected, explain layout mapping. */
  pdfTemplateMappedHint?: string | null;
  onLayoutChange: (layout: ResumeLayoutId) => void;
  onColorPresetChange: (presetId: string) => void;
  onBackgroundChange: (color: string) => void;
  onAccentChange: (color: string) => void;
};

export default function ResumeThemePicker({
  layout,
  colorPresetId,
  background,
  accent,
  pdfTemplateMappedHint,
  onLayoutChange,
  onColorPresetChange,
  onBackgroundChange,
  onAccentChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-card)] p-4 print:hidden">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)] mb-2">
          Resume template
        </p>
        {pdfTemplateMappedHint && (
          <p className="mb-2 text-xs text-violet-800 dark:text-violet-200">
            {pdfTemplateMappedHint}
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RESUME_LAYOUTS.map((item) => {
            const active = layout === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onLayoutChange(item.id)}
                className={`text-left rounded-xl border px-3 py-2.5 transition ${
                  active
                    ? 'border-blue-600 bg-[var(--shell-active)] shadow-sm'
                    : 'border-[var(--shell-border)] hover:bg-[var(--shell-hover)]'
                }`}
              >
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  {item.label}
                </span>
                <span className="block text-xs text-[var(--shell-muted)] mt-0.5">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--foreground)] mb-2">
          Color theme
        </p>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
          <span>Background</span>
          <input
            type="color"
            value={background}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-[var(--shell-border)] bg-[var(--shell-input)]"
          />
          <span className="text-xs text-[var(--shell-subtle)] font-mono">
            {background}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
          <span>Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => onAccentChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-[var(--shell-border)] bg-[var(--shell-input)]"
          />
          <span className="text-xs text-[var(--shell-subtle)] font-mono">{accent}</span>
        </label>
      </div>
    </div>
  );
}
