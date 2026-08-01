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
  onLayoutChange,
  onColorPresetChange,
  onBackgroundChange,
  onAccentChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 print:hidden">
      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Resume template</p>
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
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Color theme</p>
        <div className="flex flex-wrap gap-2">
          {RESUME_COLOR_PRESETS.map((preset) => {
            const active = colorPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => onColorPresetChange(preset.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  active
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
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
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <span>Background</span>
          <input
            type="color"
            value={background}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white"
          />
          <span className="text-xs text-gray-500 font-mono">{background}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <span>Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => onAccentChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white"
          />
          <span className="text-xs text-gray-500 font-mono">{accent}</span>
        </label>
      </div>
    </div>
  );
}
