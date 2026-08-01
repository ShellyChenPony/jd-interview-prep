import { jsPDF } from 'jspdf';
import type { ResumeTemplate } from '@/lib/resume-template';

function safeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w\u4e00-\u9fff\- ]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return cleaned || 'resume';
}

/** Normalize text so standard PDF fonts don't choke on exotic glyphs. */
function pdfText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7]/g, '-')
    .replace(/\r\n/g, '\n')
    .trim();
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

/** Build a text-based A4 PDF from structured resume data (no html2canvas). */
export function downloadResumePdfFromData(
  resumeInput: ResumeTemplate | Partial<ResumeTemplate>,
  personName?: string
): void {
  const resume = coerceResumeForPdf(resumeInput);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const w: PdfWriter = {
    pdf,
    x: margin,
    y: margin,
    maxWidth: pageWidth - margin * 2,
    pageHeight,
    margin,
  };

  writeWrapped(w, resume.name, {
    fontSize: 20,
    fontStyle: 'bold',
    gapAfter: 2,
  });
  writeWrapped(w, resume.title, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [29, 78, 216],
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
    writeSectionTitle(w, 'Summary');
    writeWrapped(w, resume.summary, { fontSize: 10, gapAfter: 3 });
  }

  if (resume.skills.length) {
    writeSectionTitle(w, 'Skills');
    for (const group of resume.skills) {
      writeWrapped(w, `${group.category}: ${group.items.join(', ')}`, {
        fontSize: 10,
        gapAfter: 1.5,
      });
    }
    w.y += 1;
  }

  if (resume.experience.length) {
    writeSectionTitle(w, 'Experience');
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
    writeSectionTitle(w, 'Education');
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
    writeSectionTitle(w, 'Projects');
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
