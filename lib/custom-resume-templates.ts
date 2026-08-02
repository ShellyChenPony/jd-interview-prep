import { z } from 'zod';
import {
  DEFAULT_PDF_LAYOUT_PROFILE,
  normalizePdfLayoutProfile,
  PdfLayoutProfileSchema,
  profileToLayoutId,
  profileToPromptHint,
  resolveLayoutId,
  type PdfLayoutProfile,
} from '@/lib/pdf-layout-profile';
import {
  DEFAULT_COLOR_PRESET_ID,
  DEFAULT_RESUME_LAYOUT,
  isResumeLayoutId,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

/** v2: PDF-uploaded templates with extracted reference text. */
const STORAGE_KEY = 'custom-resume-templates-v2';
const SELECTED_KEY = 'custom-resume-template-selected-v2';

/** Cap stored / prompted template text (localStorage + LLM context). */
export const MAX_TEMPLATE_TEXT_CHARS = 14_000;

export const CustomResumeTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  /** Original uploaded file name */
  sourceFilename: z.string(),
  /** Extracted text from the PDF template (structure / style reference) */
  templateText: z.string().min(1),
  layout: z.string(),
  colorPresetId: z.string(),
  background: z.string().optional(),
  accent: z.string().optional(),
  /** AI notes from analyze-resume-template (section order, density, tone). */
  styleNotes: z.string().optional(),
  /** Rich visual layout for the flexible renderer. */
  layoutProfile: PdfLayoutProfileSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomResumeTemplate = z.infer<typeof CustomResumeTemplateSchema>;

/** Payload sent to format-resume. */
export const CustomTemplateBriefSchema = z.object({
  name: z.string(),
  sourceFilename: z.string(),
  templateText: z.string(),
  layout: z.string(),
  styleNotes: z.string().optional(),
  layoutProfile: PdfLayoutProfileSchema.optional(),
});

export type CustomTemplateBrief = z.infer<typeof CustomTemplateBriefSchema>;

/** AI analysis after PDF upload (includes rich layout profile). */
export const AnalyzedPdfTemplateSchema = z.object({
  name: z.string().describe('Short name for this template based on the PDF'),
  layout: z
    .string()
    .describe('Best matching legacy layout: classic, sidebar, banner, or timeline'),
  styleNotes: z
    .string()
    .describe(
      '2-4 sentences on section order, density, and tone observed in the PDF template'
    ),
  layoutProfile: PdfLayoutProfileSchema.describe(
    'Structured visual layout to approximate the PDF in our HTML renderer'
  ),
});

export type AnalyzedPdfTemplate = z.infer<typeof AnalyzedPdfTemplateSchema>;

export function truncateTemplateText(text: string): string {
  const trimmed = text.replace(/\r\n/g, '\n').trim();
  if (trimmed.length <= MAX_TEMPLATE_TEXT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_TEMPLATE_TEXT_CHARS)}\n\n[…template truncated…]`;
}

export function createPdfCustomTemplate(input: {
  name: string;
  sourceFilename: string;
  templateText: string;
  layout?: string;
  colorPresetId?: string;
  styleNotes?: string;
  layoutProfile?: PdfLayoutProfile | null;
}): CustomResumeTemplate {
  const now = new Date().toISOString();
  const profile =
    normalizePdfLayoutProfile(input.layoutProfile) ?? undefined;
  const layout = profile
    ? resolveLayoutId(input.layout, profile)
    : normalizeLayout(input.layout);
  return {
    id: crypto.randomUUID(),
    name: input.name.trim() || input.sourceFilename || 'PDF template',
    sourceFilename: input.sourceFilename,
    templateText: truncateTemplateText(input.templateText),
    layout,
    colorPresetId: input.colorPresetId || DEFAULT_COLOR_PRESET_ID,
    styleNotes: input.styleNotes?.trim() || undefined,
    layoutProfile: profile,
    accent: profile?.accentHint,
    background: profile?.backgroundHint,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeLayout(value: string | undefined): ResumeLayoutId {
  return isResumeLayoutId(value) ? value : DEFAULT_RESUME_LAYOUT;
}

export function toBrief(t: CustomResumeTemplate): CustomTemplateBrief {
  const profile = normalizePdfLayoutProfile(t.layoutProfile) ?? undefined;
  return {
    name: t.name,
    sourceFilename: t.sourceFilename,
    templateText: truncateTemplateText(t.templateText),
    layout: resolveLayoutId(t.layout, profile),
    styleNotes: t.styleNotes?.trim() || undefined,
    layoutProfile: profile,
  };
}

export function listCustomTemplates(): CustomResumeTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = z.array(CustomResumeTemplateSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) {
      // Soft-recover older rows missing layoutProfile.
      const loose = JSON.parse(raw) as unknown;
      if (!Array.isArray(loose)) return [];
      const recovered: CustomResumeTemplate[] = [];
      for (const item of loose) {
        const one = CustomResumeTemplateSchema.safeParse({
          ...((item as object) ?? {}),
          layoutProfile: normalizePdfLayoutProfile(
            (item as { layoutProfile?: unknown })?.layoutProfile
          ) ?? undefined,
        });
        if (one.success) recovered.push(one.data);
      }
      return recovered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return parsed.data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveCustomTemplates(items: CustomResumeTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota — caller may show error
  }
}

export function upsertCustomTemplate(
  template: CustomResumeTemplate
): CustomResumeTemplate[] {
  const items = listCustomTemplates();
  const idx = items.findIndex((t) => t.id === template.id);
  const profile = normalizePdfLayoutProfile(template.layoutProfile) ?? undefined;
  const next: CustomResumeTemplate = {
    ...template,
    templateText: truncateTemplateText(template.templateText),
    layout: resolveLayoutId(template.layout, profile),
    styleNotes: template.styleNotes?.trim() || undefined,
    layoutProfile: profile,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) items[idx] = next;
  else items.unshift(next);
  saveCustomTemplates(items);
  return listCustomTemplates();
}

export function deleteCustomTemplate(id: string): CustomResumeTemplate[] {
  const items = listCustomTemplates().filter((t) => t.id !== id);
  saveCustomTemplates(items);
  if (getSelectedCustomTemplateId() === id) {
    setSelectedCustomTemplateId(null);
  }
  return items;
}

export function getSelectedCustomTemplateId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

export function setSelectedCustomTemplateId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!id) window.localStorage.removeItem(SELECTED_KEY);
    else window.localStorage.setItem(SELECTED_KEY, id);
  } catch {
    // ignore
  }
}

export function briefToPromptBlock(brief: CustomTemplateBrief): string {
  const notes = brief.styleNotes?.trim();
  const profile = normalizePdfLayoutProfile(brief.layoutProfile);
  const profileHint = profile
    ? profileToPromptHint(profile)
    : `legacyLayout=${brief.layout}`;
  const order =
    profile?.mainSectionOrder.join(' → ') ||
    DEFAULT_PDF_LAYOUT_PROFILE.mainSectionOrder.join(' → ');

  return `
The user uploaded a PDF resume TEMPLATE. Use it as the PRIMARY structure / section-order / tone reference.
Do NOT copy names, employers, schools, dates, or metrics from the template — those belong to someone else.
Fill the template pattern with the USER resume content below.

Template name: ${brief.name || '(unnamed)'}
Template file: ${brief.sourceFilename || '(unknown)'}
Visual layout engine hint: ${profileHint}
Preferred section order for JSON fields: ${order}
${notes ? `\nStyle notes from template analysis:\n${notes}\n` : ''}
--- BEGIN PDF TEMPLATE TEXT ---
${brief.templateText}
--- END PDF TEMPLATE TEXT ---
`.trim();
}

/** Apply analyzed profile colors onto template when hints exist. */
export function mergeAnalyzedIntoTemplate(
  existing: CustomResumeTemplate,
  analyzed: AnalyzedPdfTemplate
): CustomResumeTemplate {
  const profile = normalizePdfLayoutProfile(analyzed.layoutProfile);
  const layout = profile
    ? resolveLayoutId(analyzed.layout, profile)
    : normalizeLayout(analyzed.layout);
  return {
    ...existing,
    name: analyzed.name.trim() || existing.name,
    layout,
    styleNotes: analyzed.styleNotes.trim() || existing.styleNotes,
    layoutProfile: profile ?? existing.layoutProfile,
    accent: profile?.accentHint || existing.accent,
    background: profile?.backgroundHint || existing.background,
  };
}

export {
  profileToLayoutId,
  normalizePdfLayoutProfile,
  resolveLayoutId,
};
export type { PdfLayoutProfile };
