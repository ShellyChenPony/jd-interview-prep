import { jsPDF } from 'jspdf';
import {
  DEFAULT_RESUME_LANGUAGE,
  getSectionLabels,
  type ResumeLanguageCode,
  type ResumeSectionLabels,
} from '@/lib/resume-languages';
import type { ResumeTemplate } from '@/lib/resume-template';
import {
  buildResumeTheme,
  type ResumeTheme,
} from '@/lib/resume-themes';

export function languageNeedsCjkPdf(language: ResumeLanguageCode): boolean {
  return language === 'zh-CN';
}

function safeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w\u4e00-\u9fff\- ]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return cleaned || 'resume';
}

function keepText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

/** Normalize text for Latin-1 PDF fonts. */
function pdfText(value: unknown): string {
  return keepText(value)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7]/g, '-');
}

type PdfWriter = {
  pdf: jsPDF;
  x: number;
  y: number;
  maxWidth: number;
  pageHeight: number;
  margin: number;
};

function ensureSpace(w: PdfWriter, needed: number) {
  if (w.y + needed > w.pageHeight - w.margin) {
    w.pdf.addPage();
    w.y = w.margin;
  }
}

function writeWrapped(
  w: PdfWriter,
  text: string,
  options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    gapAfter?: number;
  } = {}
) {
  const content = pdfText(text);
  if (!content) return;

  const fontSize = options.fontSize ?? 10;
  const fontStyle = options.fontStyle ?? 'normal';
  const color = options.color ?? ([23, 23, 23] as [number, number, number]);
  const gapAfter = options.gapAfter ?? 2;

  w.pdf.setFont('helvetica', fontStyle);
  w.pdf.setFontSize(fontSize);
  w.pdf.setTextColor(color[0], color[1], color[2]);

  const lines = w.pdf.splitTextToSize(content, w.maxWidth) as string[];
  const lineHeight = Math.max(fontSize * 0.42, 4);

  for (const line of lines) {
    ensureSpace(w, lineHeight);
    w.pdf.text(line, w.x, w.y);
    w.y += lineHeight;
  }
  w.y += gapAfter;
}

function writeSectionTitle(w: PdfWriter, title: string) {
  w.y += 2;
  writeWrapped(w, title.toUpperCase(), {
    fontSize: 9,
    fontStyle: 'bold',
    color: [100, 100, 100],
    gapAfter: 2,
  });
  w.pdf.setDrawColor(220, 220, 220);
  w.pdf.line(w.x, w.y - 1, w.x + w.maxWidth, w.y - 1);
  w.y += 3;
}

function addCanvasToPdf(canvas: HTMLCanvasElement, personName?: string) {
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = margin - (contentHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`${safeFilename(personName ?? 'resume')}.pdf`);
}

function el(
  tag: string,
  styles: string,
  children: Array<Node | string | null | undefined> = []
): HTMLElement {
  const node = document.createElement(tag);
  node.setAttribute('style', styles);
  for (const child of children) {
    if (child == null || child === '') continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Resume DOM built with hex-only inline styles (no Tailwind / lab / oklch). */
function buildPlainResumeNode(
  resume: ResumeTemplate,
  labels: ResumeSectionLabels,
  theme: ResumeTheme
): HTMLElement {
  const root = el(
    'div',
    [
      'box-sizing:border-box',
      'width:794px',
      `background:${theme.background}`,
      `color:${theme.text}`,
      'font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Segoe UI",sans-serif',
      'line-height:1.55',
      'text-align:left',
      'overflow:hidden',
    ].join(';')
  );

  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
  ]
    .filter(Boolean)
    .join(' · ');

  const sectionTitle = (title: string) =>
    el(
      'div',
      `font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${theme.muted};margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid ${theme.accent}55`,
      [title]
    );

  if (theme.layout === 'banner') {
    const header = el('div', `padding:28px 48px;background:${theme.accent};color:#ffffff`);
    header.append(
      el('div', 'font-size:28px;font-weight:700;margin:0 0 6px;color:#ffffff', [resume.name])
    );
    if (resume.title) {
      header.append(
        el('div', 'font-size:16px;font-weight:600;margin:0 0 8px;color:#ffffff', [resume.title])
      );
    }
    if (contact) {
      header.append(el('div', 'font-size:12px;color:#ffffff;opacity:0.92', [contact]));
    }
    root.append(header);
  } else if (theme.layout === 'sidebar') {
    // Handled below with a two-column shell.
  } else {
    const headerWrap = el('div', 'padding:40px 48px 0');
    headerWrap.append(
      el('div', `font-size:28px;font-weight:700;margin:0 0 6px;color:${theme.text}`, [
        resume.name,
      ])
    );
    if (resume.title) {
      headerWrap.append(
        el('div', `font-size:16px;font-weight:600;margin:0 0 10px;color:${theme.accent}`, [
          resume.title,
        ])
      );
    }
    if (contact) {
      headerWrap.append(
        el(
          'div',
          `font-size:12px;color:${theme.muted};margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid ${theme.accent}55`,
          [contact]
        )
      );
    }
    root.append(headerWrap);
  }

  const body = el(
    'div',
    theme.layout === 'banner' || theme.layout === 'sidebar'
      ? 'padding:28px 48px 40px'
      : 'padding:0 48px 40px'
  );

  const appendContent = (target: HTMLElement, includeSkills: boolean) => {
    if (resume.summary) {
      target.append(sectionTitle(labels.summary));
      target.append(
        el('div', `font-size:13px;color:${theme.text};margin:0 0 8px`, [resume.summary])
      );
    }

    if (includeSkills && resume.skills.length) {
      target.append(sectionTitle(labels.skills));
      for (const group of resume.skills) {
        target.append(
          el('div', `font-size:13px;color:${theme.text};margin:0 0 4px`, [
            el('span', `font-weight:700;color:${theme.text}`, [`${group.category}: `]),
            group.items.join(' · '),
          ])
        );
      }
    }

    if (resume.experience.length) {
      target.append(sectionTitle(labels.experience));
      for (const job of resume.experience) {
        const block = el('div', 'margin:0 0 14px');
        block.append(
          el('div', 'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap', [
            el('div', `font-size:14px;font-weight:700;color:${theme.text}`, [
              `${job.role}${job.company ? ` — ${job.company}` : ''}`,
            ]),
            el('div', `font-size:12px;color:${theme.muted}`, [job.period]),
          ])
        );
        if (job.location) {
          block.append(
            el('div', `font-size:12px;color:${theme.muted};margin:2px 0 6px`, [job.location])
          );
        }
        for (const bullet of job.bullets) {
          block.append(
            el('div', `font-size:13px;color:${theme.text};margin:0 0 3px;padding-left:12px`, [
              `• ${bullet}`,
            ])
          );
        }
        target.append(block);
      }
    }

    if (resume.education.length) {
      target.append(sectionTitle(labels.education));
      for (const ed of resume.education) {
        target.append(
          el(
            'div',
            'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 6px',
            [
              el('div', `font-size:13px;color:${theme.text}`, [
                el('span', `font-weight:700;color:${theme.text}`, [ed.degree]),
                ed.school ? ` — ${ed.school}` : '',
              ]),
              el('div', `font-size:12px;color:${theme.muted}`, [ed.period]),
            ]
          )
        );
      }
    }

    if (resume.projects.length) {
      target.append(sectionTitle(labels.projects));
      for (const project of resume.projects) {
        const block = el('div', 'margin:0 0 12px');
        block.append(
          el('div', `font-size:13px;font-weight:700;color:${theme.text};margin:0 0 2px`, [
            project.name,
          ])
        );
        if (project.description) {
          block.append(
            el('div', `font-size:13px;color:${theme.text};margin:0 0 2px`, [
              project.description,
            ])
          );
        }
        if (project.tech) {
          block.append(el('div', `font-size:12px;color:${theme.muted}`, [project.tech]));
        }
        target.append(block);
      }
    }
  };

  if (theme.layout === 'sidebar') {
    const shell = el('div', 'display:flex;width:794px;min-height:1000px');
    const aside = el(
      'div',
      `width:240px;box-sizing:border-box;padding:28px 20px;background:${theme.accent};color:#ffffff`
    );
    aside.append(
      el('div', 'font-size:22px;font-weight:700;margin:0 0 8px;color:#ffffff', [resume.name])
    );
    if (resume.title) {
      aside.append(
        el('div', 'font-size:13px;font-weight:600;margin:0 0 16px;color:#ffffff', [resume.title])
      );
    }
    if (contact) {
      aside.append(
        el('div', 'font-size:11px;line-height:1.5;color:#ffffff;opacity:0.95;margin:0 0 18px', [
          contact,
        ])
      );
    }
    if (resume.skills.length) {
      aside.append(
        el('div', 'font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 8px;color:#ffffff', [
          labels.skills,
        ])
      );
      for (const group of resume.skills) {
        aside.append(
          el('div', 'font-size:11px;color:#ffffff;margin:0 0 8px', [
            el('div', 'font-weight:700', [group.category]),
            el('div', 'opacity:0.92;margin-top:2px', [group.items.join(' · ')]),
          ])
        );
      }
    }
    const main = el('div', `flex:1;box-sizing:border-box;padding:28px 28px 36px;background:${theme.background}`);
    appendContent(main, false);
    shell.append(aside, main);
    root.append(shell);
    return root;
  }

  appendContent(body, true);
  root.append(body);
  return root;
}

/**
 * CJK-safe export: build a hex-only offscreen resume (no page CSS),
 * then rasterize it. Avoids html2canvas failing on lab()/oklch().
 */
export async function downloadResumePdfViaPreview(
  resumeInput: ResumeTemplate | Partial<ResumeTemplate>,
  language: ResumeLanguageCode,
  personName?: string,
  theme: ResumeTheme = buildResumeTheme({})
): Promise<void> {
  const resume = coerceResumeForCjk(resumeInput);
  const labels = getSectionLabels(language);
  const host = document.createElement('div');
  host.setAttribute(
    'style',
    [
      'position:fixed',
      'left:-10000px',
      'top:0',
      'width:794px',
      `background:${theme.background}`,
      'z-index:-1',
      'pointer-events:none',
    ].join(';')
  );

  const node = buildPlainResumeNode(resume, labels, theme);
  host.append(node);
  document.body.append(host);

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: theme.background,
      logging: false,
      ignoreElements: (element) => element.tagName === 'STYLE' || element.tagName === 'LINK',
      onclone: (clonedDoc, clonedElement) => {
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => n.remove());
        if (clonedElement instanceof HTMLElement) {
          clonedElement.style.backgroundColor = theme.background;
          clonedElement.style.color = theme.text;
        }
      },
    });
    addCanvasToPdf(canvas, personName ?? resume.name);
  } finally {
    host.remove();
  }
}

function coerceResumeForCjk(input: Partial<ResumeTemplate>): ResumeTemplate {
  return {
    name: keepText(input.name) || 'Resume',
    title: keepText(input.title),
    contact: {
      email: keepText(input.contact?.email),
      phone: keepText(input.contact?.phone),
      location: keepText(input.contact?.location),
      linkedin: keepText(input.contact?.linkedin),
      github: keepText(input.contact?.github),
    },
    summary: keepText(input.summary),
    skills: (input.skills ?? [])
      .filter(Boolean)
      .map((group) => ({
        category: keepText(group?.category) || 'Skills',
        items: (group?.items ?? []).filter(Boolean).map(keepText),
      }))
      .filter((g) => g.items.length > 0 || g.category),
    experience: (input.experience ?? [])
      .filter(Boolean)
      .map((job) => ({
        company: keepText(job?.company),
        role: keepText(job?.role),
        location: keepText(job?.location),
        period: keepText(job?.period),
        bullets: (job?.bullets ?? []).filter(Boolean).map(keepText),
      })),
    education: (input.education ?? [])
      .filter(Boolean)
      .map((ed) => ({
        school: keepText(ed?.school),
        degree: keepText(ed?.degree),
        period: keepText(ed?.period),
      })),
    projects: (input.projects ?? [])
      .filter(Boolean)
      .map((project) => ({
        name: keepText(project?.name),
        description: keepText(project?.description),
        tech: keepText(project?.tech),
      })),
  };
}

/** Fill missing fields so a visible preview can always export. */
export function coerceResumeForPdf(input: Partial<ResumeTemplate>): ResumeTemplate {
  return {
    name: pdfText(input.name) || 'Resume',
    title: pdfText(input.title),
    contact: {
      email: pdfText(input.contact?.email),
      phone: pdfText(input.contact?.phone),
      location: pdfText(input.contact?.location),
      linkedin: pdfText(input.contact?.linkedin),
      github: pdfText(input.contact?.github),
    },
    summary: pdfText(input.summary),
    skills: (input.skills ?? [])
      .filter(Boolean)
      .map((group) => ({
        category: pdfText(group?.category) || 'Skills',
        items: (group?.items ?? []).filter(Boolean).map(pdfText),
      }))
      .filter((g) => g.items.length > 0 || g.category),
    experience: (input.experience ?? [])
      .filter(Boolean)
      .map((job) => ({
        company: pdfText(job?.company),
        role: pdfText(job?.role),
        location: pdfText(job?.location),
        period: pdfText(job?.period),
        bullets: (job?.bullets ?? []).filter(Boolean).map(pdfText),
      })),
    education: (input.education ?? [])
      .filter(Boolean)
      .map((ed) => ({
        school: pdfText(ed?.school),
        degree: pdfText(ed?.degree),
        period: pdfText(ed?.period),
      })),
    projects: (input.projects ?? [])
      .filter(Boolean)
      .map((project) => ({
        name: pdfText(project?.name),
        description: pdfText(project?.description),
        tech: pdfText(project?.tech),
      })),
  };
}

/** Build a text-based A4 PDF from structured resume data (Latin fonts). */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return [23, 23, 23];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function downloadResumePdfFromData(
  resumeInput: ResumeTemplate | Partial<ResumeTemplate>,
  personName?: string,
  language: ResumeLanguageCode = DEFAULT_RESUME_LANGUAGE,
  theme: ResumeTheme = buildResumeTheme({})
): void {
  const resume = coerceResumeForPdf(resumeInput);
  const labels = getSectionLabels(language);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bg = hexToRgb(theme.background);
  pdf.setFillColor(bg[0], bg[1], bg[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  const w: PdfWriter = {
    pdf,
    x: margin,
    y: margin,
    maxWidth: pageWidth - margin * 2,
    pageHeight,
    margin,
  };

  const accentRgb = hexToRgb(theme.accent);
  const textRgb = hexToRgb(theme.text);

  writeWrapped(w, resume.name, {
    fontSize: 20,
    fontStyle: 'bold',
    color: textRgb,
    gapAfter: 2,
  });
  writeWrapped(w, resume.title, {
    fontSize: 12,
    fontStyle: 'bold',
    color: accentRgb,
    gapAfter: 3,
  });

  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
  ]
    .filter(Boolean)
    .join('  |  ');
  if (contact) {
    writeWrapped(w, contact, { fontSize: 9, color: [82, 82, 82], gapAfter: 4 });
  }

  if (resume.summary) {
    writeSectionTitle(w, labels.summary);
    writeWrapped(w, resume.summary, { fontSize: 10, gapAfter: 3 });
  }

  if (resume.skills.length) {
    writeSectionTitle(w, labels.skills);
    for (const group of resume.skills) {
      writeWrapped(w, `${group.category}: ${group.items.join(', ')}`, {
        fontSize: 10,
        gapAfter: 1.5,
      });
    }
    w.y += 1;
  }

  if (resume.experience.length) {
    writeSectionTitle(w, labels.experience);
    for (const job of resume.experience) {
      writeWrapped(w, `${job.role}${job.company ? ` - ${job.company}` : ''}`, {
        fontSize: 11,
        fontStyle: 'bold',
        gapAfter: 1,
      });
      writeWrapped(w, `${job.period}${job.location ? `  |  ${job.location}` : ''}`, {
        fontSize: 9,
        color: [100, 100, 100],
        gapAfter: 1.5,
      });
      for (const bullet of job.bullets) {
        writeWrapped(w, `- ${bullet}`, { fontSize: 10, gapAfter: 1.2 });
      }
      w.y += 2;
    }
  }

  if (resume.education.length) {
    writeSectionTitle(w, labels.education);
    for (const ed of resume.education) {
      writeWrapped(w, `${ed.degree}${ed.school ? ` - ${ed.school}` : ''}`, {
        fontSize: 10,
        fontStyle: 'bold',
        gapAfter: 1,
      });
      writeWrapped(w, ed.period, { fontSize: 9, color: [100, 100, 100], gapAfter: 2 });
    }
  }

  if (resume.projects.length) {
    writeSectionTitle(w, labels.projects);
    for (const project of resume.projects) {
      writeWrapped(w, project.name, { fontSize: 10, fontStyle: 'bold', gapAfter: 1 });
      writeWrapped(w, project.description, { fontSize: 10, gapAfter: 1 });
      if (project.tech) {
        writeWrapped(w, project.tech, { fontSize: 9, color: [100, 100, 100], gapAfter: 2 });
      }
    }
  }

  pdf.save(`${safeFilename(personName ?? resume.name)}.pdf`);
}

/** Smart download: CJK via plain offscreen HTML, others via text PDF. */
export async function downloadResumePdf(options: {
  resume: ResumeTemplate | Partial<ResumeTemplate>;
  language: ResumeLanguageCode;
  personName?: string;
  previewElement?: HTMLElement | null;
  theme?: ResumeTheme;
}): Promise<void> {
  const { resume, language, personName, theme = buildResumeTheme({}) } = options;

  // Use HTML capture for CJK fonts and for non-classic layouts (sidebar/banner/timeline).
  if (languageNeedsCjkPdf(language) || theme.layout !== 'classic') {
    await downloadResumePdfViaPreview(resume, language, personName, theme);
    return;
  }

  downloadResumePdfFromData(resume, personName, language, theme);
}
