import { z } from 'zod';
import { pinyin } from 'pinyin-pro';
import type { ResumeLanguageCode } from '@/lib/resume-languages';

export const ResumeTemplateSchema = z.object({
  name: z
    .string()
    .describe(
      'Full name in output language. English mode: Romanized Latin letters only (e.g. Shaoli Chen), no Chinese characters.'
    ),
  title: z.string().describe('Professional headline / target role'),
  contact: z.object({
    email: z.string().describe('Email, or empty string if missing'),
    phone: z.string().describe('Phone, or empty string if missing'),
    location: z
      .string()
      .describe(
        'Location / timezone. English mode: English place names only (e.g. Shanghai, Pudong), no Chinese characters.'
      ),
    linkedin: z.string().describe('LinkedIn URL or handle, or empty string'),
    github: z.string().describe('GitHub URL or handle, or empty string'),
  }),
  summary: z.string().describe('2-4 sentence professional summary in English'),
  skills: z
    .array(
      z.object({
        category: z.string().describe('Skill group name, e.g. Frontend, Backend'),
        items: z.array(z.string()).describe('Skill keywords in this group'),
      })
    )
    .describe('Grouped skills'),
  experience: z
    .array(
      z.object({
        company: z
          .string()
          .describe('Employer name in the output language (English mode: English name, no Chinese)'),
        role: z.string(),
        location: z
          .string()
          .describe('City or Remote. English mode: English only, no Chinese characters.'),
        period: z.string().describe('Date range, e.g. 2022 – Present'),
        bullets: z
          .array(z.string())
          .describe(
            'Achievement bullets with impact. Newest role: 4-6 bullets; next: 3-4; older roles: 2-3.'
          ),
      })
    )
    .describe('Work experience, newest first by end date'),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      period: z.string(),
    })
  ),
  projects: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            'Project — Company; entire string in output language (English mode: no Chinese characters)'
          ),
        description: z
          .string()
          .describe(
            '1-3 sentences in output language; richer for projects from the most recent company'
          ),
        tech: z.string().describe('Tech stack / methods, joined with · ; empty string if none'),
      })
    )
    .describe(
      'Projects ordered by employment timeline (newest company first, matching experience order). Empty only if truly none.'
    ),
});

export type ResumeTemplate = z.infer<typeof ResumeTemplateSchema>;

/** Normalize company tokens for matching project ↔ experience. */
function companyMatchKey(value: string): string {
  const raw = value.toLowerCase().replace(/\s+/g, '');
  if (/花旗|citi/.test(raw)) return 'citi';
  if (/携程|ctrip|trip\.com/.test(raw)) return 'ctrip';
  if (/同程|tongcheng|ly\.com/.test(raw)) return 'tongcheng';
  if (/阿里|alibaba|alipay|蚂蚁|antgroup/.test(raw)) return 'alibaba';
  if (/腾讯|tencent/.test(raw)) return 'tencent';
  if (/字节|bytedance|抖音|tiktok/.test(raw)) return 'bytedance';
  if (/美团|meituan/.test(raw)) return 'meituan';
  if (/京东|jd\.com|jingdong/.test(raw)) return 'jd';
  return raw.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
}

function projectCompanyRank(
  projectName: string,
  experience: ResumeTemplate['experience']
): number {
  const hay = companyMatchKey(projectName);
  for (let i = 0; i < experience.length; i++) {
    const company = experience[i]?.company;
    if (!company) continue;
    const key = companyMatchKey(company);
    if (!key) continue;
    if (hay.includes(key) || key.includes(hay.slice(-Math.min(key.length, 12)))) {
      return i;
    }
    // Match English short brand inside "Project — Company"
    const short = key.slice(0, Math.min(8, key.length));
    if (short.length >= 3 && hay.includes(short)) return i;
  }
  return Number.MAX_SAFE_INTEGER;
}

/** Sort projects to follow experience timeline (newest employer first). */
export function sortProjectsByExperience(
  experience: ResumeTemplate['experience'],
  projects: ResumeTemplate['projects']
): ResumeTemplate['projects'] {
  if (!projects?.length || !experience?.length) return projects ?? [];
  return projects
    .map((project, index) => ({
      project,
      index,
      rank: projectCompanyRank(project.name, experience),
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.project);
}

const CJK_RE = /[\u4e00-\u9fff]/;

function hasCjk(value: string): boolean {
  return CJK_RE.test(value);
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Western resume order: GivenName Surname (陈少利 → Shaoli Chen). */
export function romanizeChineseName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || !hasCjk(trimmed)) return trimmed;

  const chars = [...trimmed].filter((ch) => CJK_RE.test(ch));
  if (chars.length === 0) return trimmed.replace(CJK_RE, '').trim() || trimmed;

  const syllables = chars
    .map(
      (ch) =>
        pinyin(ch, { toneType: 'none', type: 'array' })[0]?.replace(/\s+/g, '') ?? ''
    )
    .filter(Boolean);

  if (syllables.length === 1) return capitalizeWord(syllables[0]);

  const surname = capitalizeWord(syllables[0]);
  const given = capitalizeWord(syllables.slice(1).join(''));
  return `${given} ${surname}`.trim();
}

/** Longer phrases first so 上海市浦东新区 wins over 上海. */
const LOCATION_EN: Array<[string, string]> = [
  ['上海市浦东新区', 'Shanghai, Pudong'],
  ['上海市徐汇区', 'Shanghai, Xuhui'],
  ['上海市闵行区', 'Shanghai, Minhang'],
  ['北京市朝阳区', 'Beijing, Chaoyang'],
  ['北京市海淀区', 'Beijing, Haidian'],
  ['深圳市南山区', 'Shenzhen, Nanshan'],
  ['杭州市西湖区', 'Hangzhou, Xihu'],
  ['广州市天河区', 'Guangzhou, Tianhe'],
  ['浦东新区', 'Pudong'],
  ['上海市', 'Shanghai'],
  ['北京市', 'Beijing'],
  ['深圳市', 'Shenzhen'],
  ['杭州市', 'Hangzhou'],
  ['广州市', 'Guangzhou'],
  ['成都市', 'Chengdu'],
  ['南京市', 'Nanjing'],
  ['武汉市', 'Wuhan'],
  ['苏州市', 'Suzhou'],
  ['西安市', "Xi'an"],
  ['重庆市', 'Chongqing'],
  ['天津市', 'Tianjin'],
  ['上海', 'Shanghai'],
  ['北京', 'Beijing'],
  ['深圳', 'Shenzhen'],
  ['杭州', 'Hangzhou'],
  ['广州', 'Guangzhou'],
  ['成都', 'Chengdu'],
  ['南京', 'Nanjing'],
  ['武汉', 'Wuhan'],
  ['苏州', 'Suzhou'],
  ['西安', "Xi'an"],
  ['重庆', 'Chongqing'],
  ['天津', 'Tianjin'],
  ['中国', 'China'],
];

export function localizeLocationToEnglish(location: string): string {
  let result = location.trim();
  if (!result || !hasCjk(result)) return result;

  for (const [zh, en] of LOCATION_EN) {
    result = result.split(zh).join(en);
  }

  if (hasCjk(result)) {
    result = result.replace(/[\u4e00-\u9fff]+/g, (chunk) =>
      pinyin(chunk, { toneType: 'none', type: 'array' })
        .map((part) => capitalizeWord(String(part).replace(/\s+/g, '')))
        .filter(Boolean)
        .join(' ')
    );
  }

  return result.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
}

/** Ensure English resumes don't keep CJK in name / locations. */
export function localizeResumeFields(
  resume: ResumeTemplate,
  language: ResumeLanguageCode
): ResumeTemplate {
  if (language !== 'en') return resume;

  return {
    ...resume,
    name: hasCjk(resume.name) ? romanizeChineseName(resume.name) : resume.name,
    contact: {
      ...resume.contact,
      location: hasCjk(resume.contact.location)
        ? localizeLocationToEnglish(resume.contact.location)
        : resume.contact.location,
    },
    experience: (resume.experience ?? []).map((job) => ({
      ...job,
      location: hasCjk(job.location)
        ? localizeLocationToEnglish(job.location)
        : job.location,
    })),
  };
}

/** Post-process model output for stable ordering / language expectations. */
export function normalizeFormattedResume(
  resume: ResumeTemplate,
  language: ResumeLanguageCode = 'en'
): ResumeTemplate {
  const ordered = {
    ...resume,
    projects: sortProjectsByExperience(resume.experience, resume.projects),
  };
  return localizeResumeFields(ordered, language);
}

/** Remote-friendly English resume sample — replace with your own details. */
export const sampleResume: ResumeTemplate = {
  name: 'Alex Chen',
  title: 'Senior Full-Stack Engineer',
  contact: {
    email: 'alex.chen@email.com',
    phone: '+1 (415) 555-0123',
    location: 'Remote · UTC+8 (overlap with US/EU mornings)',
    linkedin: 'linkedin.com/in/alexchen',
    github: 'github.com/alexchen',
  },
  summary:
    'Full-stack engineer with 6+ years building scalable web products for global remote teams. Strong in TypeScript, React, and Node.js; experienced shipping features end-to-end with clear communication across time zones.',
  skills: [
    {
      category: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
    },
    {
      category: 'Frontend',
      items: ['React', 'Next.js', 'Tailwind CSS', 'HTML/CSS'],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'PostgreSQL', 'REST/GraphQL', 'Redis'],
    },
    {
      category: 'Practices',
      items: ['CI/CD', 'System Design', 'Agile/Remote Collaboration', 'Code Review'],
    },
  ],
  experience: [
    {
      company: 'Northstar Labs',
      role: 'Senior Software Engineer',
      location: 'Remote',
      period: '2022 – Present',
      bullets: [
        'Led redesign of the customer dashboard in Next.js, cutting p95 page load by 40% and raising weekly active usage by 18%.',
        'Built and owned a Node.js billing API serving 50k+ monthly transactions with 99.9% uptime.',
        'Mentored 3 engineers; ran async design reviews and improved PR cycle time from 3 days to under 1 day.',
      ],
    },
    {
      company: 'PixelWave Inc.',
      role: 'Software Engineer',
      location: 'Shanghai / Hybrid',
      period: '2019 – 2022',
      bullets: [
        'Shipped React feature modules for a B2B SaaS product used by 200+ enterprise clients.',
        'Introduced automated testing (Jest + Playwright), reducing production regressions by ~30%.',
        'Partnered with product and design in English to scope MVPs and deliver on quarterly OKRs.',
      ],
    },
  ],
  education: [
    {
      school: 'Example University',
      degree: 'B.S. in Computer Science',
      period: '2015 – 2019',
    },
  ],
  projects: [
    {
      name: 'Interview Prep Assistant',
      description:
        'AI-powered tool that turns job descriptions into targeted English interview questions and answering tips.',
      tech: 'Next.js · OpenAI · Vercel AI SDK',
    },
    {
      name: 'Open-source UI Kit',
      description:
        'Accessible React component library with 2k+ GitHub stars; maintained docs and release notes in English.',
      tech: 'React · TypeScript · Storybook',
    },
  ],
};

export function resumeToPlainText(resume: ResumeTemplate): string {
  const skills = resume.skills
    .map((s) => `${s.category}: ${s.items.join(', ')}`)
    .join('\n');

  const experience = resume.experience
    .map(
      (job) =>
        `${job.role} — ${job.company} (${job.location})\n${job.period}\n${job.bullets
          .map((b) => `• ${b}`)
          .join('\n')}`
    )
    .join('\n\n');

  const education = resume.education
    .map((ed) => `${ed.degree} — ${ed.school}\n${ed.period}`)
    .join('\n\n');

  const projects = resume.projects
    .map((p) => `${p.name}\n${p.description}\nTech: ${p.tech}`)
    .join('\n\n');

  return [
    resume.name,
    resume.title,
    [
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
      resume.contact.linkedin,
      resume.contact.github,
    ]
      .filter(Boolean)
      .join(' | '),
    '',
    'SUMMARY',
    resume.summary,
    '',
    'SKILLS',
    skills,
    '',
    'EXPERIENCE',
    experience,
    '',
    'EDUCATION',
    education,
    '',
    'PROJECTS',
    projects,
  ].join('\n');
}
