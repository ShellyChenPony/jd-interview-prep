export const RESUME_LANGUAGES = [
  { code: 'en', label: 'English', promptName: 'English' },
  { code: 'zh-CN', label: '中文（简体）', promptName: 'Simplified Chinese' },
  { code: 'zh-TW', label: '中文（繁體）', promptName: 'Traditional Chinese' },
  { code: 'ja', label: '日本語', promptName: 'Japanese' },
  { code: 'ko', label: '한국어', promptName: 'Korean' },
  { code: 'es', label: 'Español', promptName: 'Spanish' },
  { code: 'fr', label: 'Français', promptName: 'French' },
  { code: 'de', label: 'Deutsch', promptName: 'German' },
] as const;

export type ResumeLanguageCode = (typeof RESUME_LANGUAGES)[number]['code'];

export const DEFAULT_RESUME_LANGUAGE: ResumeLanguageCode = 'en';

export function isResumeLanguageCode(value: unknown): value is ResumeLanguageCode {
  return (
    typeof value === 'string' &&
    RESUME_LANGUAGES.some((lang) => lang.code === value)
  );
}

export function getResumeLanguage(code: string | undefined | null) {
  return (
    RESUME_LANGUAGES.find((lang) => lang.code === code) ??
    RESUME_LANGUAGES.find((lang) => lang.code === DEFAULT_RESUME_LANGUAGE)!
  );
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
  'zh-TW': {
    summary: '個人總結',
    skills: '技能',
    experience: '工作經歷',
    education: '教育背景',
    projects: '專案經歷',
  },
  ja: {
    summary: '職務要約',
    skills: 'スキル',
    experience: '職務経歴',
    education: '学歴',
    projects: 'プロジェクト',
  },
  ko: {
    summary: '요약',
    skills: '기술',
    experience: '경력',
    education: '학력',
    projects: '프로젝트',
  },
  es: {
    summary: 'Resumen',
    skills: 'Habilidades',
    experience: 'Experiencia',
    education: 'Educación',
    projects: 'Proyectos',
  },
  fr: {
    summary: 'Résumé',
    skills: 'Compétences',
    experience: 'Expérience',
    education: 'Formation',
    projects: 'Projets',
  },
  de: {
    summary: 'Profil',
    skills: 'Fähigkeiten',
    experience: 'Berufserfahrung',
    education: 'Ausbildung',
    projects: 'Projekte',
  },
};

export function getSectionLabels(code: string | undefined | null): ResumeSectionLabels {
  const lang = getResumeLanguage(code);
  return SECTION_LABELS[lang.code];
}
