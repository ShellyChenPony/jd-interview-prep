export const RESUME_LANGUAGES = [
  { code: 'en', label: 'English', promptName: 'English' },
  { code: 'zh-CN', label: '中文', promptName: 'Simplified Chinese' },
] as const;

export type ResumeLanguageCode = (typeof RESUME_LANGUAGES)[number]['code'];

export const DEFAULT_RESUME_LANGUAGE: ResumeLanguageCode = 'en';

/** Map legacy / unsupported codes to the two supported languages. */
export function normalizeResumeLanguage(value: unknown): ResumeLanguageCode {
  if (value === 'en') return 'en';
  if (typeof value === 'string' && (value === 'zh-CN' || value.startsWith('zh'))) {
    return 'zh-CN';
  }
  return DEFAULT_RESUME_LANGUAGE;
}

export function isResumeLanguageCode(value: unknown): value is ResumeLanguageCode {
  return value === 'en' || value === 'zh-CN';
}

export function getResumeLanguage(code: string | undefined | null) {
  const normalized = normalizeResumeLanguage(code);
  return RESUME_LANGUAGES.find((lang) => lang.code === normalized)!;
}

export type ResumeSectionLabels = {
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
};

const SECTION_LABELS: Record<ResumeLanguageCode, ResumeSectionLabels> = {
  en: {
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    projects: 'Projects',
  },
  'zh-CN': {
    summary: '个人总结',
    skills: '技能',
    experience: '工作经历',
    education: '教育背景',
    projects: '项目经历',
  },
};

export function getSectionLabels(code: string | undefined | null): ResumeSectionLabels {
  const lang = getResumeLanguage(code);
  return SECTION_LABELS[lang.code];
}
