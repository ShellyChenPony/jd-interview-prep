import type { ResumeLanguageCode } from '@/lib/resume-languages';

export type UiCopy = {
  brand: string;
  resumeNav: string;
  prepNav: string;
  list: string;
  resumeTitle: string;
  resumeSubtitle: string;
  prepTitle: string;
  prepSubtitle: string;
  resumeHistory: string;
  resumeHistoryHint: string;
  prepHistory: string;
  prepHistoryHint: string;
  new: string;
  loading: string;
  delete: string;
  deleting: string;
  noResumeHistory: string;
  noPrepHistory: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  resumeHelp: string;
  uploadFile: string;
  extracting: string;
  resetSample: string;
  pasteResume: string;
  formatAi: string;
  formatting: string;
  savingHistory: string;
  syncEdits: string;
  syncHint: string;
  interviewMarkers: string;
  generatingMarkers: string;
  copyText: string;
  copied: string;
  print: string;
  downloadPdf: string;
  generatingPdf: string;
  jobDescription: string;
  jdHelp: string;
  jdPlaceholder: string;
  questionsTab: string;
  questionsHint: string;
  matchTab: string;
  matchHint: string;
  coverTab: string;
  coverHint: string;
  generateQuestionsTitle: string;
  generateQuestionsHelp: string;
  generate15: string;
  generating: string;
  generatingWait: string;
  coreRequirement: string;
  questions: string;
  whyAsked: string;
  suggestedAnswer: string;
  keyTips: string;
  reviewLinks: string;
  matchTitle: string;
  matchHelp: string;
  resumeFromHistory: string;
  selectResume: string;
  selected: string;
  analyzeFit: string;
  analyzing: string;
  analyzingWait: string;
  overallFit: string;
  strongMatches: string;
  gaps: string;
  improvementPlan: string;
  pasteJdFirst: string;
  selectResumeFirst: string;
  coverTitle: string;
  coverHelp: string;
  generateCover: string;
  generatingCover: string;
  generatingCoverWait: string;
  coverLetter: string;
  coverHighlights: string;
  coverTips: string;
  copyLetter: string;
  letterCopied: string;
};

const EN: UiCopy = {
  brand: 'AI Remote Job Prep',
  resumeNav: 'Resume',
  prepNav: 'Prep',
  list: 'List',
  resumeTitle: 'Resume Template',
  resumeSubtitle: 'Upload or paste a resume, format with AI, then export.',
  prepTitle: 'Interview Prep',
  prepSubtitle:
    'Paste a JD, generate practice questions, analyze fit, or draft an NZ cover letter.',
  resumeHistory: 'Resume History',
  resumeHistoryHint: 'Saved formatted resumes',
  prepHistory: 'Prep History',
  prepHistoryHint: 'JD, questions, fit & cover letters',
  new: 'New',
  loading: 'Loading…',
  delete: 'Delete',
  deleting: 'Deleting…',
  noResumeHistory: 'No saved resumes yet. Upload and format one on the right.',
  noPrepHistory: 'No prep sessions yet. Paste a JD and generate on the right.',
  language: 'Language',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  resumeHelp:
    'Upload/paste first (edit freely), then Format once with AI. Small text fixes can sync into the generated resume without another AI call.',
  uploadFile: 'Upload file',
  extracting: 'Extracting text...',
  resetSample: 'Reset sample',
  pasteResume: 'Paste resume content here...',
  formatAi: 'Format with AI',
  formatting: 'Formatting...',
  savingHistory: 'Saving to history...',
  syncEdits: 'Sync edits to resume (no AI)',
  syncHint:
    'Upload only extracts text into the box. After AI Format, tweak names/phones/companies in the text and click Sync — no extra API call. Large rewrites still need Format with AI.',
  interviewMarkers: 'Interview markers',
  generatingMarkers: 'Generating Q markers...',
  copyText: 'Copy as text',
  copied: 'Copied!',
  print: 'Print',
  downloadPdf: 'Download PDF',
  generatingPdf: 'Generating PDF...',
  jobDescription: 'Job Description',
  jdHelp:
    'Paste the target JD, then use a tool below. Results are saved to Prep History on the left.',
  jdPlaceholder: 'Paste the Job Description (JD) here...',
  questionsTab: '15 Questions',
  questionsHint: 'Practice Qs + sample answers',
  matchTab: 'JD × Resume',
  matchHint: 'Fit analysis + improvement plan',
  coverTab: 'Cover Letter',
  coverHint: 'NZ-style letter from JD + resume',
  generateQuestionsTitle: 'Generate interview questions',
  generateQuestionsHelp:
    'Generate 15 high-frequency questions from the JD, each with a sample answer and review links.',
  generate15: 'Generate 15 questions',
  generating: 'Generating…',
  generatingWait: 'Analyzing the JD and generating questions — about a minute…',
  coreRequirement: 'Core requirement',
  questions: 'Questions',
  whyAsked: 'Why asked',
  suggestedAnswer: 'Suggested answer',
  keyTips: 'Key tips',
  reviewLinks: 'Review links',
  matchTitle: 'Compare JD with your resume',
  matchHelp:
    'Pick a resume from Resume History, then see matches, gaps, and how to improve before applying.',
  resumeFromHistory: 'Resume from History',
  selectResume: 'Select a saved resume...',
  selected: 'Selected',
  analyzeFit: 'Analyze fit',
  analyzing: 'Analyzing…',
  analyzingWait: 'Comparing JD and resume…',
  overallFit: 'Overall fit',
  strongMatches: 'Strong matches',
  gaps: 'Gaps / mismatches',
  improvementPlan: 'If you apply: improvement plan',
  pasteJdFirst: 'Please paste a JD first.',
  selectResumeFirst: 'Please select a resume from History first.',
  coverTitle: 'NZ cover / recommendation letter',
  coverHelp:
    'Pick a resume, then generate a one-page cover letter tailored to this JD — common for New Zealand applications.',
  generateCover: 'Generate letter',
  generatingCover: 'Writing…',
  generatingCoverWait: 'Drafting your NZ cover letter…',
  coverLetter: 'Letter',
  coverHighlights: 'Highlights used',
  coverTips: 'NZ tips',
  copyLetter: 'Copy letter',
  letterCopied: 'Copied!',
};

const ZH_CN: UiCopy = {
  brand: 'AI 远程面试准备',
  resumeNav: '简历',
  prepNav: '面试',
  list: '列表',
  resumeTitle: '简历模板',
  resumeSubtitle: '上传或粘贴简历，用 AI 排版后导出。',
  prepTitle: '面试准备',
  prepSubtitle: '粘贴 JD，生成练习题、匹配分析，或按新西兰习惯写推荐信。',
  resumeHistory: '简历历史',
  resumeHistoryHint: '已保存的排版简历',
  prepHistory: '面试历史',
  prepHistoryHint: 'JD、题目、匹配与推荐信',
  new: '新建',
  loading: '加载中…',
  delete: '删除',
  deleting: '删除中…',
  noResumeHistory: '还没有保存的简历。请在右侧上传并排版。',
  noPrepHistory: '还没有面试记录。请在右侧粘贴 JD 并生成。',
  language: '语言',
  theme: '主题',
  themeLight: '浅色',
  themeDark: '深色',
  resumeHelp:
    '先上传/粘贴（可自由修改），再用 AI 排版一次。小改动可同步到生成稿，无需再次调用 AI。',
  uploadFile: '上传文件',
  extracting: '正在提取文本...',
  resetSample: '恢复示例',
  pasteResume: '在此粘贴简历内容...',
  formatAi: 'AI 排版',
  formatting: '正在排版...',
  savingHistory: '正在保存历史...',
  syncEdits: '同步修改到简历（不调用 AI）',
  syncHint:
    '上传只提取文本到输入框。AI 排版后，可改姓名/电话/公司名再点同步——不额外调用接口。大段重写仍需 AI 排版。',
  interviewMarkers: '面试题标记',
  generatingMarkers: '正在生成面试标记...',
  copyText: '复制文本',
  copied: '已复制！',
  print: '打印',
  downloadPdf: '下载 PDF',
  generatingPdf: '正在生成 PDF...',
  jobDescription: '职位描述',
  jdHelp: '粘贴目标岗位 JD，再选择下方功能。结果会自动保存到左侧面试历史。',
  jdPlaceholder: '在此粘贴 Job Description (JD)...',
  questionsTab: '15 道题',
  questionsHint: '练习题 + 参考答案',
  matchTab: 'JD × 简历',
  matchHint: '匹配分析 + 提升建议',
  coverTab: '推荐信',
  coverHint: '按 JD 生成新西兰求职信',
  generateQuestionsTitle: '生成面试题',
  generateQuestionsHelp: '基于 JD 生成 15 道高频题，每题含建议答案与复习链接。',
  generate15: '生成 15 道题',
  generating: '生成中…',
  generatingWait: '正在分析 JD 并生成题目，大约需要一分钟…',
  coreRequirement: '核心要求',
  questions: '面试题',
  whyAsked: '考察意图',
  suggestedAnswer: '建议回答',
  keyTips: '答题要点',
  reviewLinks: '复习链接',
  matchTitle: 'JD 与简历匹配分析',
  matchHelp: '从简历历史选择一份简历，查看匹配点、缺口与应聘前提升建议。',
  resumeFromHistory: '从历史选择简历',
  selectResume: '选择已保存的简历...',
  selected: '已选择',
  analyzeFit: '分析匹配度',
  analyzing: '分析中…',
  analyzingWait: '正在比对 JD 与简历…',
  overallFit: '总体匹配',
  strongMatches: '适合的点',
  gaps: '不合适 / 缺口',
  improvementPlan: '如果要应聘：提升建议',
  pasteJdFirst: '请先粘贴 JD。',
  selectResumeFirst: '请先从历史中选择一份简历。',
  coverTitle: '新西兰推荐信 / Cover Letter',
  coverHelp:
    '选择简历后，按本 JD 生成一页求职推荐信——新西兰投递岗位时常用。',
  generateCover: '生成推荐信',
  generatingCover: '撰写中…',
  generatingCoverWait: '正在撰写新西兰风格推荐信…',
  coverLetter: '正文',
  coverHighlights: '信中亮点',
  coverTips: '新西兰投递提示',
  copyLetter: '复制全文',
  letterCopied: '已复制！',
};

export function getUiCopy(code: ResumeLanguageCode | string | null | undefined): UiCopy {
  if (code === 'zh-CN' || (typeof code === 'string' && code.startsWith('zh'))) {
    return ZH_CN;
  }
  return EN;
}
