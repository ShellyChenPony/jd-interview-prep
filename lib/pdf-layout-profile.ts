import { z } from 'zod';
import {
  DEFAULT_RESUME_LAYOUT,
  isResumeLayoutId,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

export const SECTION_IDS = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SIDEBAR_SECTION_IDS = [
  'contact',
  'skills',
  'summary',
  'education',
] as const;

export type SidebarSectionId = (typeof SIDEBAR_SECTION_IDS)[number];

/** Rich visual layout inferred from an uploaded PDF template. */
export const PdfLayoutProfileSchema = z.object({
  columns: z
    .enum(['single', 'sidebar-left', 'sidebar-right'])
    .describe('Overall column structure'),
  headerStyle: z
    .enum(['plain', 'centered', 'banner', 'split'])
    .describe('How the name/title/contact header is presented'),
  sidebarWidth: z
    .enum(['narrow', 'medium', 'wide'])
    .describe('Sidebar width when columns is sidebar-*'),
  sidebarFill: z
    .enum(['accent', 'muted', 'none'])
    .describe('Sidebar background treatment'),
  sidebarSections: z
    .array(z.enum(SIDEBAR_SECTION_IDS))
    .describe('Blocks that belong in the sidebar (order matters)'),
  mainSectionOrder: z
    .array(z.enum(SECTION_IDS))
    .describe('Main column section order (skip sidebar-only sections)'),
  sectionTitleStyle: z
    .enum(['underline', 'accent-bar', 'plain-caps'])
    .describe('Section heading style'),
  nameSize: z.enum(['md', 'lg', 'xl']).describe('Name heading size'),
  density: z
    .enum(['compact', 'comfortable', 'spacious'])
    .describe('Vertical spacing density'),
  contactPlacement: z
    .enum(['header', 'sidebar', 'below-name'])
    .describe('Where contact lines appear'),
  skillsPlacement: z
    .enum(['main', 'sidebar', 'both'])
    .describe('Where skills appear'),
  accentHint: z
    .string()
    .optional()
    .describe('Optional accent color hex if obvious from the template, else empty'),
  backgroundHint: z
    .string()
    .optional()
    .describe('Optional page background hex if obvious, else empty'),
});

export type PdfLayoutProfile = z.infer<typeof PdfLayoutProfileSchema>;

export const DEFAULT_PDF_LAYOUT_PROFILE: PdfLayoutProfile = {
  columns: 'single',
  headerStyle: 'plain',
  sidebarWidth: 'medium',
  sidebarFill: 'none',
  sidebarSections: [],
  mainSectionOrder: ['summary', 'skills', 'experience', 'education', 'projects'],
  sectionTitleStyle: 'underline',
  nameSize: 'lg',
  density: 'comfortable',
  contactPlacement: 'header',
  skillsPlacement: 'main',
};

function uniqueSections<T extends string>(items: T[], allowed: readonly T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of items) {
    if (!allowed.includes(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

/** Coerce partial / AI output into a safe full profile. */
export function normalizePdfLayoutProfile(
  raw: unknown
): PdfLayoutProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = PdfLayoutProfileSchema.safeParse(raw);
  const base = parsed.success
    ? parsed.data
    : PdfLayoutProfileSchema.partial().safeParse(raw).success
      ? {
          ...DEFAULT_PDF_LAYOUT_PROFILE,
          ...(PdfLayoutProfileSchema.partial().parse(raw) as Partial<PdfLayoutProfile>),
        }
      : null;
  if (!base) return null;

  const columns = base.columns ?? DEFAULT_PDF_LAYOUT_PROFILE.columns;
  const hasSidebar = columns === 'sidebar-left' || columns === 'sidebar-right';

  let sidebarSections = uniqueSections(
    base.sidebarSections ?? [],
    SIDEBAR_SECTION_IDS
  );
  let mainSectionOrder = uniqueSections(
    base.mainSectionOrder?.length
      ? base.mainSectionOrder
      : DEFAULT_PDF_LAYOUT_PROFILE.mainSectionOrder,
    SECTION_IDS
  );

  // Ensure every section appears somewhere.
  for (const id of SECTION_IDS) {
    const inMain = mainSectionOrder.includes(id);
    const inSide =
      (id === 'skills' && sidebarSections.includes('skills')) ||
      (id === 'summary' && sidebarSections.includes('summary')) ||
      (id === 'education' && sidebarSections.includes('education'));
    if (!inMain && !inSide) mainSectionOrder.push(id);
  }

  if (!hasSidebar) {
    sidebarSections = [];
  } else if (sidebarSections.length === 0) {
    sidebarSections = ['contact', 'skills'];
  }

  let contactPlacement = base.contactPlacement ?? 'header';
  let skillsPlacement = base.skillsPlacement ?? 'main';
  if (hasSidebar && sidebarSections.includes('contact')) {
    contactPlacement = 'sidebar';
  }
  if (hasSidebar && sidebarSections.includes('skills')) {
    skillsPlacement = skillsPlacement === 'main' ? 'sidebar' : skillsPlacement;
  }
  if (!hasSidebar && skillsPlacement === 'sidebar') {
    skillsPlacement = 'main';
  }

  const accentHint = sanitizeHex(base.accentHint);
  const backgroundHint = sanitizeHex(base.backgroundHint);

  return {
    columns,
    headerStyle: base.headerStyle ?? 'plain',
    sidebarWidth: base.sidebarWidth ?? 'medium',
    sidebarFill: base.sidebarFill ?? (hasSidebar ? 'accent' : 'none'),
    sidebarSections,
    mainSectionOrder,
    sectionTitleStyle: base.sectionTitleStyle ?? 'underline',
    nameSize: base.nameSize ?? 'lg',
    density: base.density ?? 'comfortable',
    contactPlacement,
    skillsPlacement,
    accentHint,
    backgroundHint,
  };
}

function sanitizeHex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, a, b, c] = v;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return undefined;
}

/** Map profile → closest built-in layout id (for legacy / export fallbacks). */
export function profileToLayoutId(profile: PdfLayoutProfile): ResumeLayoutId {
  if (profile.columns === 'sidebar-left' || profile.columns === 'sidebar-right') {
    return 'sidebar';
  }
  if (profile.headerStyle === 'banner') return 'banner';
  if (profile.sectionTitleStyle === 'accent-bar') return 'timeline';
  return DEFAULT_RESUME_LAYOUT;
}

/** Prefer AI layout string when valid, else derive from profile. */
export function resolveLayoutId(
  layout: string | undefined,
  profile: PdfLayoutProfile | null | undefined
): ResumeLayoutId {
  if (isResumeLayoutId(layout)) return layout;
  if (profile) return profileToLayoutId(profile);
  return DEFAULT_RESUME_LAYOUT;
}

export function profileToPromptHint(profile: PdfLayoutProfile): string {
  return [
    `columns=${profile.columns}`,
    `header=${profile.headerStyle}`,
    `mainOrder=${profile.mainSectionOrder.join('>')}`,
    profile.sidebarSections.length
      ? `sidebar=${profile.sidebarSections.join(',')}`
      : null,
    `titles=${profile.sectionTitleStyle}`,
    `density=${profile.density}`,
  ]
    .filter(Boolean)
    .join('; ');
}
