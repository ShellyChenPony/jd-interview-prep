export const RESUME_LAYOUTS = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Clean single-column layout',
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    description: 'Accent column for contact & skills',
  },
  {
    id: 'banner',
    label: 'Banner',
    description: 'Bold colored header band',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Modern sections with accent rail',
  },
] as const;

export type ResumeLayoutId = (typeof RESUME_LAYOUTS)[number]['id'];

export const DEFAULT_RESUME_LAYOUT: ResumeLayoutId = 'classic';

export function isResumeLayoutId(value: unknown): value is ResumeLayoutId {
  return (
    typeof value === 'string' &&
    RESUME_LAYOUTS.some((layout) => layout.id === value)
  );
}

export type ResumeColorPreset = {
  id: string;
  label: string;
  /** Page / panel background */
  background: string;
  /** Accent for headers, sidebar, titles */
  accent: string;
  /** Main body text */
  text: string;
  /** Muted secondary text */
  muted: string;
};

export const RESUME_COLOR_PRESETS: ResumeColorPreset[] = [
  {
    id: 'navy',
    label: 'Navy',
    background: '#ffffff',
    accent: '#1e3a5f',
    text: '#171717',
    muted: '#525252',
  },
  {
    id: 'teal',
    label: 'Teal',
    background: '#f7fbfb',
    accent: '#0f766e',
    text: '#134e4a',
    muted: '#5b716f',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#f8faf7',
    accent: '#3f6212',
    text: '#1a2e05',
    muted: '#4b5563',
  },
  {
    id: 'slate',
    label: 'Slate',
    background: '#f8fafc',
    accent: '#334155',
    text: '#0f172a',
    muted: '#64748b',
  },
  {
    id: 'burgundy',
    label: 'Burgundy',
    background: '#fffbfb',
    accent: '#9f1239',
    text: '#1c1917',
    muted: '#78716c',
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    background: '#fafafa',
    accent: '#262626',
    text: '#171717',
    muted: '#737373',
  },
];

export const DEFAULT_COLOR_PRESET_ID = 'navy';

export type ResumeTheme = {
  layout: ResumeLayoutId;
  background: string;
  accent: string;
  text: string;
  muted: string;
};

export function getColorPreset(id: string | undefined | null): ResumeColorPreset {
  return (
    RESUME_COLOR_PRESETS.find((preset) => preset.id === id) ??
    RESUME_COLOR_PRESETS.find((preset) => preset.id === DEFAULT_COLOR_PRESET_ID)!
  );
}

export function buildResumeTheme(input: {
  layout?: ResumeLayoutId;
  presetId?: string;
  background?: string;
  accent?: string;
}): ResumeTheme {
  const preset = getColorPreset(input.presetId);
  return {
    layout: input.layout && isResumeLayoutId(input.layout) ? input.layout : DEFAULT_RESUME_LAYOUT,
    background: input.background?.trim() || preset.background,
    accent: input.accent?.trim() || preset.accent,
    text: preset.text,
    muted: preset.muted,
  };
}
