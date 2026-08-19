import type { ResumeLanguageCode } from '@/lib/resume-languages';

export type UiCopy = {
  brand: string;
  resumeNav: string;
  prepNav: string;
  practiceNav: string;
  list: string;
  resumeTitle: string;
  resumeSubtitle: string;
  prepTitle: string;
  prepSubtitle: string;
  practiceTitle: string;
  practiceSubtitle: string;
  resumeHistory: string;
  resumeHistoryHint: string;
  prepHistory: string;
  prepHistoryHint: string;
  practiceSideTitle: string;
  practiceSideHint: string;
  practiceCategories: string;
  practiceHistory: string;
  new: string;
  loading: string;
  delete: string;
  deleting: string;
  noResumeHistory: string;
  noPrepHistory: string;
  noPracticeHistory: string;
  practiceBrowseTab: string;
  practiceBrowseHint: string;
  practiceRecommendTab: string;
  practiceRecommendHint: string;
  practiceRecommendTitle: string;
  practiceRecommendHelp: string;
  practiceRecommendCta: string;
  practiceRecommending: string;
  practiceRecommendWait: string;
  practicePrimaryCategory: string;
  practiceProblems: string;
  practiceOpen: string;
  practicePractice: string;
  practiceBackToList: string;
  practicePrompt: string;
  practiceGoal: string;
  practiceHints: string;
  practiceStarterSql: string;
  practiceCopySql: string;
  practiceSqlCopied: string;
  practiceMarkDone: string;
  practiceMarkUndone: string;
  practiceDone: string;
  practiceOpenLeetcode: string;
  practiceSqlEditorHint: string;
  practiceKindLeetcode: string;
  practiceKindSupabase: string;
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
  resumeTemplateLabel: string;
  resumeTemplateHint: string;
  templateAppearance: string;
  showColors: string;
  hideColors: string;
  previewLabel: string;
  customTplTitle: string;
  customTplHelp: string;
  customTplUploadPdf: string;
  customTplUploading: string;
  customTplAnalyzing: string;
  customTplUploadFail: string;
  customTplPdfOnly: string;
  customTplNone: string;
  customTplNoneHint: string;
  customTplNewName: string;
  customTplEmpty: string;
  customTplActive: string;
  customTplApplyHint: string;
  customTplLayoutMapped: string;
  customTplStyleNotes: string;
  customTplProfilePending: string;
  formatAiWithTpl: string;
  quotaLoading: string;
  quotaLoadFail: string;
  quotaTitle: string;
  quotaHint: string;
  quotaRemainingToday: string;
  quotaLowHint: string;
  quotaExhaustedHint: string;
  quotaResetsUtc: string;
  quotaFeatFormat: string;
  quotaFeatGenerate: string;
  quotaFeatMatch: string;
  quotaFeatCover: string;
  quotaFeatPractice: string;
  quotaFeatMarkers: string;
  quotaFeatAnalyzeTpl: string;
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
  homeBadge: string;
  homeHeadline: string;
  homeHeadlineAccent: string;
  homeSub: string;
  homeCtaResume: string;
  homeCtaPrep: string;
  homeOpenApp: string;
  homeFeaturesTitle: string;
  homeFeaturesSub: string;
  homeFeatureResumeTitle: string;
  homeFeatureResumeBody: string;
  homeFeatureQuestionsTitle: string;
  homeFeatureQuestionsBody: string;
  homeFeatureMatchTitle: string;
  homeFeatureMatchBody: string;
  homeFeatureCoverTitle: string;
  homeFeatureCoverBody: string;
  homeFeaturePracticeTitle: string;
  homeFeaturePracticeBody: string;
  homeCtaPractice: string;
  homeStepsTitle: string;
  homeStep1Title: string;
  homeStep1Body: string;
  homeStep2Title: string;
  homeStep2Body: string;
  homeStep3Title: string;
  homeStep3Body: string;
  homeFooterCta: string;
  homeFooterNote: string;
  authLoading: string;
  authSignInGoogle: string;
  authSigningIn: string;
  authSignOut: string;
  authSigningOut: string;
  authAccount: string;
  authSignInError: string;
  authSignOutError: string;
  authMemberBadge: string;
  settings: string;
  loginTitle: string;
  loginSub: string;
  loginContinue: string;
  loginBackHome: string;
  loginUnavailable: string;
  feedbackOpen: string;
  feedbackTitle: string;
  feedbackHint: string;
  feedbackSupportHint: string;
  feedbackSupportLink: string;
  feedbackSupportCopied: string;
  feedbackCategory: string;
  feedbackCatGeneral: string;
  feedbackCatBug: string;
  feedbackCatIdea: string;
  feedbackCatOther: string;
  feedbackMessage: string;
  feedbackMessagePlaceholder: string;
  feedbackEmail: string;
  feedbackEmailPlaceholder: string;
  feedbackSubmit: string;
  feedbackSubmitting: string;
  feedbackSuccess: string;
  feedbackError: string;
  feedbackClose: string;
};

const EN: UiCopy = {
  brand: 'AI Remote Job Prep',
  resumeNav: 'Resume',
  prepNav: 'Prep',
  practiceNav: 'Drill',
  list: 'List',
  resumeTitle: 'Resume Template',
  resumeSubtitle: 'Format your resume with AI, then add interview markers.',
  prepTitle: 'Interview Prep',
  prepSubtitle:
    'Paste a JD, generate practice questions, analyze fit, or draft an NZ cover letter.',
  practiceTitle: 'LeetCode Practice',
  practiceSubtitle:
    'Browse problems by role, or paste a JD to get a tailored practice list.',
  resumeHistory: 'Resume History',
  resumeHistoryHint: 'Saved formatted resumes',
  prepHistory: 'Prep History',
  prepHistoryHint: 'JD, questions, fit & cover letters',
  practiceSideTitle: 'Practice',
  practiceSideHint: 'Roles & JD recommendations',
  practiceCategories: 'Job roles',
  practiceHistory: 'JD recommendations',
  new: 'New',
  loading: 'Loading…',
  delete: 'Delete',
  deleting: 'Deleting…',
  noResumeHistory: 'No saved resumes yet. Upload and format one on the right.',
  noPrepHistory: 'No prep sessions yet. Paste a JD and generate on the right.',
  noPracticeHistory: 'No JD recommendations yet. Paste a JD on the right.',
  practiceBrowseTab: 'By role',
  practiceBrowseHint: 'LeetCode sets per job type',
  practiceRecommendTab: 'From JD',
  practiceRecommendHint: 'AI picks what to drill',
  practiceRecommendTitle: 'Recommend problems from JD',
  practiceRecommendHelp:
    'Paste the target JD. We map it to a role track and suggest LeetCode problems from our catalog.',
  practiceRecommendCta: 'Recommend problems',
  practiceRecommending: 'Recommending…',
  practiceRecommendWait: 'Reading the JD and ranking practice problems…',
  practicePrimaryCategory: 'Primary track',
  practiceProblems: 'problems',
  practiceOpen: 'Open',
  practicePractice: 'Practice',
  practiceBackToList: 'Back to list',
  practicePrompt: 'Prompt',
  practiceGoal: 'Goal',
  practiceHints: 'Hints',
  practiceStarterSql: 'Starter SQL',
  practiceCopySql: 'Copy SQL',
  practiceSqlCopied: 'Copied!',
  practiceMarkDone: 'Mark done',
  practiceMarkUndone: 'Mark undone',
  practiceDone: 'Done',
  practiceOpenLeetcode: 'Open on LeetCode',
  practiceSqlEditorHint:
    'Copy the starter into the Supabase SQL Editor (same project as this app). Replace YOUR_DEVICE_ID with the id from localStorage key device_id if needed.',
  practiceKindLeetcode: 'LeetCode',
  practiceKindSupabase: 'In-app SQL',
  language: 'Language',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  resumeHelp:
    'Paste or upload your resume, Format with AI, then add Interview markers for practice hotspots.',
  uploadFile: 'Upload file',
  extracting: 'Extracting text...',
  resetSample: 'Reset sample',
  pasteResume: 'Paste resume content here...',
  formatAi: 'Format with AI',
  formatting: 'Formatting...',
  savingHistory: 'Saving to history...',
  resumeTemplateLabel: 'Resume template',
  resumeTemplateHint:
    'Pick a built-in layout, or upload a PDF as another template option.',
  templateAppearance: 'Template & appearance',
  showColors: 'Show colors',
  hideColors: 'Hide colors',
  previewLabel: 'Preview',
  customTplTitle: 'PDF resume templates',
  customTplHelp:
    'Upload a sample resume PDF as an extra template option under Resume template.',
  customTplUploadPdf: 'Upload PDF',
  customTplUploading: 'Reading PDF…',
  customTplAnalyzing: 'Analyzing template…',
  customTplUploadFail: 'Failed to upload template PDF. Please try again.',
  customTplPdfOnly: 'Please upload a PDF file.',
  customTplNone: 'Default',
  customTplNoneHint: 'Standard AI format (no PDF template)',
  customTplNewName: 'PDF template',
  customTplEmpty: 'No PDF templates yet. Upload one to get started.',
  customTplActive: 'Using PDF template',
  customTplApplyHint:
    'Custom template selected — click Format with AI again to apply it.',
  customTplLayoutMapped:
    'Using PDF layout engine (columns / header / section order from your PDF). Color overrides below still apply.',
  customTplStyleNotes: 'Template style notes',
  customTplProfilePending:
    'Layout engine pending — re-upload this PDF if analysis did not finish.',
  formatAiWithTpl: 'Format with AI (PDF template)',
  quotaLoading: 'AI quota…',
  quotaLoadFail: 'Could not load AI quota',
  quotaTitle: 'Today’s free AI uses',
  quotaHint:
    'Free daily limits on this device (UTC). Click for details. Resets at 00:00 UTC.',
  quotaRemainingToday: 'AI left {remaining}/{limit}',
  quotaLowHint: 'Running low on free AI uses today.',
  quotaExhaustedHint: 'Some AI features are out of free uses today.',
  quotaResetsUtc: 'Resets UTC',
  quotaFeatFormat: 'Format resume',
  quotaFeatGenerate: '15 questions',
  quotaFeatMatch: 'JD × Resume',
  quotaFeatCover: 'Cover letter',
  quotaFeatPractice: 'LeetCode recommend',
  quotaFeatMarkers: 'Interview markers',
  quotaFeatAnalyzeTpl: 'PDF template analyze',
  syncEdits: 'Sync text edits (no AI)',
  syncHint:
    'After Format, small fixes in the text box can sync without another AI call.',
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
  homeBadge: 'Powered by AI',
  homeHeadline: 'Remote job prep,',
  homeHeadlineAccent: 'made clear',
  homeSub:
    'Format your resume, practice from a real JD, drill LeetCode by role, and draft a New Zealand cover letter — in one place.',
  homeCtaResume: 'Format my resume',
  homeCtaPrep: 'Prep from a JD',
  homeOpenApp: 'Open workspace',
  homeFeaturesTitle: 'What you can do here',
  homeFeaturesSub: 'Five tools. One calm workflow from resume to interview.',
  homeFeatureResumeTitle: 'Resume template',
  homeFeatureResumeBody:
    'Upload or paste, let AI structure it, then export PDF. Small edits sync without another AI call.',
  homeFeatureQuestionsTitle: '15 interview questions',
  homeFeatureQuestionsBody:
    'Paste a JD and get high-frequency questions with sample answers and review links.',
  homeFeatureMatchTitle: 'JD × Resume match',
  homeFeatureMatchBody:
    'See fit score, strengths, gaps, and a concrete plan before you apply.',
  homeFeatureCoverTitle: 'NZ cover letter',
  homeFeatureCoverBody:
    'Generate a recommendation / cover letter tailored to the JD — standard for New Zealand applications.',
  homeFeaturePracticeTitle: 'LeetCode by role',
  homeFeaturePracticeBody:
    'Browse curated problems by job track, or let AI recommend what to drill from your JD.',
  homeCtaPractice: 'Start drilling',
  homeStepsTitle: 'How to start',
  homeStep1Title: 'Polish the resume',
  homeStep1Body: 'Open Resume, format once with AI, save to history.',
  homeStep2Title: 'Paste the target JD',
  homeStep2Body: 'Switch to Prep and drop in the job description.',
  homeStep3Title: 'Practice, match, write',
  homeStep3Body: 'Drill LeetCode, generate questions, analyze fit, then draft the letter.',
  homeFooterCta: 'Enter the workspace',
  homeFooterNote: 'Your history stays on this device. Language and theme follow you into the app.',
  authLoading: 'Account…',
  authSignInGoogle: 'Sign in with Google',
  authSigningIn: 'Redirecting…',
  authSignOut: 'Sign out',
  authSigningOut: 'Signing out…',
  authAccount: 'Account',
  authSignInError: 'Could not start Google sign-in.',
  authSignOutError: 'Could not sign out. Please try again.',
  authMemberBadge: 'Free member',
  settings: 'Settings',
  loginTitle: 'Sign in to continue',
  loginSub: 'Use Google to open your workspace and keep history across devices.',
  loginContinue: 'Continue with Google',
  loginBackHome: 'Back to home',
  loginUnavailable: 'Google sign-in is not configured yet.',
  feedbackOpen: 'Feedback',
  feedbackTitle: 'Send feedback',
  feedbackHint: 'Ideas, bugs, or anything that would make prep easier — we read every note.',
  feedbackSupportHint:
    'Stuck or something broken? Contact support and we’ll help you get unblocked.',
  feedbackSupportLink: 'Contact support',
  feedbackSupportCopied: 'Support email copied',
  feedbackCategory: 'Type',
  feedbackCatGeneral: 'General',
  feedbackCatBug: 'Bug',
  feedbackCatIdea: 'Idea',
  feedbackCatOther: 'Other',
  feedbackMessage: 'Your message',
  feedbackMessagePlaceholder: 'What went well? What should we improve?',
  feedbackEmail: 'Email (optional)',
  feedbackEmailPlaceholder: 'So we can follow up if needed',
  feedbackSubmit: 'Send feedback',
  feedbackSubmitting: 'Sending…',
  feedbackSuccess: 'Thanks — your feedback was saved.',
  feedbackError: 'Could not send feedback. Please try again.',
  feedbackClose: 'Close',
};

const ZH_CN: UiCopy = {
  brand: 'AI 远程面试准备',
  resumeNav: '简历',
  prepNav: '面试',
  practiceNav: '刷题',
  list: '列表',
  resumeTitle: '简历模板',
  resumeSubtitle: '用 AI 整理简历，再生成面试题标记。',
  prepTitle: '面试准备',
  prepSubtitle: '粘贴 JD，生成练习题、匹配分析，或按新西兰习惯写推荐信。',
  practiceTitle: 'LeetCode 刷题',
  practiceSubtitle: '按岗位分类浏览题目，或粘贴 JD 获取针对性练习清单。',
  resumeHistory: '简历历史',
  resumeHistoryHint: '已保存的排版简历',
  prepHistory: '面试历史',
  prepHistoryHint: 'JD、题目、匹配与推荐信',
  practiceSideTitle: '刷题',
  practiceSideHint: '岗位分类与 JD 推荐',
  practiceCategories: '岗位分类',
  practiceHistory: 'JD 推荐记录',
  new: '新建',
  loading: '加载中…',
  delete: '删除',
  deleting: '删除中…',
  noResumeHistory: '还没有保存的简历。请在右侧上传并排版。',
  noPrepHistory: '还没有面试记录。请在右侧粘贴 JD 并生成。',
  noPracticeHistory: '还没有 JD 推荐。请在右侧粘贴 JD 生成。',
  practiceBrowseTab: '按岗位',
  practiceBrowseHint: '各岗位 LeetCode 题单',
  practiceRecommendTab: '按 JD',
  practiceRecommendHint: 'AI 推荐该练哪些题',
  practiceRecommendTitle: '根据 JD 推荐刷题',
  practiceRecommendHelp:
    '粘贴目标岗位 JD。我们会映射到岗位赛道，并从题库中推荐应练的 LeetCode。',
  practiceRecommendCta: '推荐题目',
  practiceRecommending: '推荐中…',
  practiceRecommendWait: '正在阅读 JD 并排序练习题…',
  practicePrimaryCategory: '主赛道',
  practiceProblems: '题',
  practiceOpen: '打开',
  practicePractice: '练习',
  practiceBackToList: '返回列表',
  practicePrompt: '题目',
  practiceGoal: '目标',
  practiceHints: '提示',
  practiceStarterSql: 'Starter SQL',
  practiceCopySql: '复制 SQL',
  practiceSqlCopied: '已复制！',
  practiceMarkDone: '标为已完成',
  practiceMarkUndone: '取消完成',
  practiceDone: '已完成',
  practiceOpenLeetcode: '在 LeetCode 打开',
  practiceSqlEditorHint:
    '把 starter 复制到 Supabase SQL Editor（与本应用同一项目）。如需 device_id，可从浏览器 localStorage 的 device_id 读取。',
  practiceKindLeetcode: 'LeetCode',
  practiceKindSupabase: '站内 SQL',
  language: '语言',
  theme: '主题',
  themeLight: '浅色',
  themeDark: '深色',
  resumeHelp: '粘贴或上传简历，用 AI 排版整理，再生成面试题标记做准备。',
  uploadFile: '上传文件',
  extracting: '正在提取文本...',
  resetSample: '恢复示例',
  pasteResume: '在此粘贴简历内容...',
  formatAi: 'AI 排版',
  formatting: '正在排版...',
  savingHistory: '正在保存历史...',
  resumeTemplateLabel: '简历模板',
  resumeTemplateHint: '选择内置版式，或上传 PDF 作为额外模板选项。',
  templateAppearance: '模板与外观',
  showColors: '显示颜色',
  hideColors: '隐藏颜色',
  previewLabel: '预览',
  customTplTitle: 'PDF 简历模板',
  customTplHelp: '上传样例 PDF，会出现在「简历模板」选项里。',
  customTplUploadPdf: '上传 PDF',
  customTplUploading: '正在读取 PDF…',
  customTplAnalyzing: '正在分析模板…',
  customTplUploadFail: '上传模板失败，请重试。',
  customTplPdfOnly: '请上传 PDF 文件。',
  customTplNone: '默认',
  customTplNoneHint: '标准 AI 排版（不使用 PDF 模板）',
  customTplNewName: 'PDF 模板',
  customTplEmpty: '还没有 PDF 模板，先上传一份吧。',
  customTplActive: '正在使用 PDF 模板',
  customTplApplyHint: '已选中自定义模板。请再点一次「AI 排版」以应用。',
  customTplLayoutMapped:
    '正在使用 PDF 版式引擎（分栏 / 页眉 / 章节顺序来自 PDF）。下方仍可改颜色。',
  customTplStyleNotes: '模板风格备注',
  customTplProfilePending: '版式引擎尚未就绪——若分析未完成，请重新上传该 PDF。',
  formatAiWithTpl: 'AI 排版（自定义模板）',
  quotaLoading: 'AI 次数…',
  quotaLoadFail: '无法加载 AI 次数',
  quotaTitle: '今日免费 AI 次数',
  quotaHint: '按本设备统计（UTC 日）。点击查看明细。每天 00:00 UTC 重置。',
  quotaRemainingToday: 'AI 剩余 {remaining}/{limit}',
  quotaLowHint: '今日免费 AI 次数所剩不多。',
  quotaExhaustedHint: '部分 AI 功能今日免费次数已用完。',
  quotaResetsUtc: 'UTC 重置日',
  quotaFeatFormat: '简历排版',
  quotaFeatGenerate: '15 道题',
  quotaFeatMatch: 'JD × 简历',
  quotaFeatCover: '推荐信',
  quotaFeatPractice: '刷题推荐',
  quotaFeatMarkers: '面试标记',
  quotaFeatAnalyzeTpl: 'PDF 模板分析',
  syncEdits: '同步文本修改（不调用 AI）',
  syncHint: '排版后可在文本框做小改动并同步，无需再次调用 AI。',
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
  homeBadge: 'AI 驱动',
  homeHeadline: '远程求职准备，',
  homeHeadlineAccent: '一目了然',
  homeSub:
    '排版简历、按 JD 刷题/面试题、匹配分析、生成新西兰推荐信——一个工作区走完。',
  homeCtaResume: '开始排版简历',
  homeCtaPrep: '从 JD 开始准备',
  homeOpenApp: '进入工作区',
  homeFeaturesTitle: '本站能做什么',
  homeFeaturesSub: '五个工具，一条从简历到面试的清晰路径。',
  homeFeatureResumeTitle: '简历模板',
  homeFeatureResumeBody:
    '上传或粘贴后用 AI 结构化排版，可导出 PDF；小改动可同步，无需再次调用 AI。',
  homeFeatureQuestionsTitle: '15 道面试题',
  homeFeatureQuestionsBody: '粘贴 JD，生成高频题、参考答案与复习链接。',
  homeFeatureMatchTitle: 'JD × 简历匹配',
  homeFeatureMatchBody: '查看匹配分、优势、缺口，以及应聘前的具体提升计划。',
  homeFeatureCoverTitle: '新西兰推荐信',
  homeFeatureCoverBody: '按 JD + 简历生成 Cover Letter——新西兰投递岗位时常用。',
  homeFeaturePracticeTitle: '按岗位刷 LeetCode',
  homeFeaturePracticeBody:
    '按岗位赛道浏览精选题，或让 AI 根据 JD 推荐该练的题目。',
  homeCtaPractice: '开始刷题',
  homeStepsTitle: '怎么开始',
  homeStep1Title: '先排好简历',
  homeStep1Body: '进入简历页，用 AI 排版一次并保存到历史。',
  homeStep2Title: '粘贴目标 JD',
  homeStep2Body: '切换到面试准备，贴上职位描述。',
  homeStep3Title: '刷题 · 匹配 · 写信',
  homeStep3Body: '刷 LeetCode、生成面试题、分析匹配度，再写推荐信。',
  homeFooterCta: '进入工作区',
  homeFooterNote: '历史保存在本设备。语言与主题设置会带入工作区。',
  authLoading: '账户…',
  authSignInGoogle: '使用 Google 登录',
  authSigningIn: '正在跳转…',
  authSignOut: '退出登录',
  authSigningOut: '正在退出…',
  authAccount: '账户',
  authSignInError: '无法开始 Google 登录。',
  authSignOutError: '退出失败，请重试。',
  authMemberBadge: '普通用户',
  settings: '设置',
  loginTitle: '登录后继续',
  loginSub: '使用 Google 登录进入工作区，历史可跨设备同步。',
  loginContinue: '使用 Google 继续',
  loginBackHome: '返回首页',
  loginUnavailable: '尚未配置 Google 登录。',
  feedbackOpen: '反馈',
  feedbackTitle: '提交反馈',
  feedbackHint: '想法、问题或改进建议都可以写下来，我们会认真看。',
  feedbackSupportHint: '如果遇到问题或功能异常，可以联系 support 获取帮助。',
  feedbackSupportLink: '联系 Support',
  feedbackSupportCopied: '已复制 Support 邮箱',
  feedbackCategory: '类型',
  feedbackCatGeneral: '一般',
  feedbackCatBug: '问题 / Bug',
  feedbackCatIdea: '想法',
  feedbackCatOther: '其他',
  feedbackMessage: '反馈内容',
  feedbackMessagePlaceholder: '哪里好用？哪里需要改进？',
  feedbackEmail: '邮箱（可选）',
  feedbackEmailPlaceholder: '方便我们必要时回复你',
  feedbackSubmit: '提交反馈',
  feedbackSubmitting: '提交中…',
  feedbackSuccess: '谢谢！反馈已保存。',
  feedbackError: '提交失败，请稍后再试。',
  feedbackClose: '关闭',
};

export function getUiCopy(code: ResumeLanguageCode | string | null | undefined): UiCopy {
  if (code === 'zh-CN' || (typeof code === 'string' && code.startsWith('zh'))) {
    return ZH_CN;
  }
  return EN;
}
