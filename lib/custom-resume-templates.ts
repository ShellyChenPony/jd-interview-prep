import { z } from 'zod';
import {
  DEFAULT_COLOR_PRESET_ID,
  DEFAULT_RESUME_LAYOUT,
  isResumeLayoutId,
  type ResumeLayoutId,
} from '@/lib/resume-themes';

/** v2: PDF-uploaded templates with extracted reference text. */
const STORAGE_KEY = 'custom-resume-templates-v2';

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
});

export type CustomTemplateBrief = z.infer<typeof CustomTemplateBriefSchema>;

/** Optional AI analysis after PDF upload. */
export const AnalyzedPdfTemplateSchema = z.object({
  name: z.string().describe('Short name for this template based on the PDF'),
  layout: z
    .string()
    .describe('Best matching visual layout: classic, sidebar, banner, or timeline'),
  styleNotes: z
    .string()
    .describe(
      '2-4 sentences on section order, density, and tone observed in the PDF template'
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
}): CustomResumeTemplate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: input.name.trim() || input.sourceFilename || 'PDF template',
    sourceFilename: input.sourceFilename,
    templateText: truncateTemplateText(input.templateText),
    layout: normalizeLayout(input.layout),
    colorPresetId: input.colorPresetId || DEFAULT_COLOR_PRESET_ID,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeLayout(value: string | undefined): ResumeLayoutId {
  return isResumeLayoutId(value) ? value : DEFAULT_RESUME_LAYOUT;
}

export function toBrief(t: CustomResumeTemplate): CustomTemplateBrief {
  return {
    name: t.name,
    sourceFilename: t.sourceFilename,
    templateText: truncateTemplateText(t.templateText),
    layout: normalizeLayout(t.layout),
  };
}

export function listCustomTemplates(): CustomResumeTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = z.array(CustomResumeTemplateSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
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
  const next: CustomResumeTemplate = {
    ...template,
    templateText: truncateTemplateText(template.templateText),
    layout: normalizeLayout(template.layout),
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
  return items;
}

export function briefToPromptBlock(brief: CustomTemplateBrief): string {
  return `
The user uploaded a PDF resume TEMPLATE. Use it ONLY as a structure / style / section-order reference.
Do NOT copy names, employers, schools, or metrics from the template — those belong to someone else.
Fill the template pattern with the USER resume content below.

Template name: ${brief.name || '(unnamed)'}
Template file: ${brief.sourceFilename || '(unknown)'}
Preferred visual layout hint: ${brief.layout}

--- BEGIN PDF TEMPLATE TEXT ---
${brief.templateText}
--- END PDF TEMPLATE TEXT ---
`.trim();
}
