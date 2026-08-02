# AI 远程求职准备（AI Remote Job Prep）

[English](./README.md)

面向远程求职的 AI 工作区：排版简历、按真实 JD 准备面试、按岗位刷 LeetCode、生成新西兰风格推荐信——集中在一个产品里完成。

**技术栈：** Next.js 16 · React 19 · Vercel AI SDK · OpenAI 兼容大模型（如 DeepSeek）· Supabase · Tailwind CSS v4

---

## 功能一览

### 首页（`/`）
欢迎页，介绍产品能力，帮助新用户进入工作区：
- 开始排版简历
- 从 JD 开始面试准备
- 开始刷题

首页可切换 **English / 简体中文**，设置会带入工作区。

### 工作区（`/pages`）
三栏布局：
- **左侧导航** — Home（AI Logo）、简历、面试、刷题
- **中间栏** — 当前 Tab 的历史记录 / 岗位分类
- **右侧** — 主工作区

右上角：**语言**（en / zh-CN）与 **主题**（浅色 / 深色）。界面文案与 AI 输出语言跟随所选语言。

---

### 1. 简历模板（`?tab=resume`）
- 上传 PDF / Word / 文本，或粘贴简历内容
- **AI 排版** 为结构化、可打印的简历模板
- **PDF 模板**：上传一份简历 PDF 作为版式/风格参考；**AI 排版** 用你自己的内容填充该模板
- 版式与配色（经典 / 侧栏 / 横幅 / 时间线）
- **同步修改**：在文本框小改后同步到排版稿，无需再次调用 AI
- **面试题标记**：在简历上生成 Q 类锚点，含参考答案与复习链接
- 导出：复制文本、打印、下载 PDF
- **简历历史**：保存、回看、软删除

### 2. 面试准备（`?tab=interview`）
粘贴 Job Description 后，使用三个子工具（结果共用同一条 Prep History）：

| 工具 | 作用 |
|------|------|
| **15 道题** | 高频面试题 + 考察意图、建议回答、答题要点、复习链接 |
| **JD × 简历** | 匹配分、适合点、缺口、应聘前提升计划（从简历历史选一份） |
| **推荐信** | 按新西兰习惯，用 JD + 简历生成 Cover Letter，可一键复制全文 |

**面试历史** 会保存 JD、题目、匹配分析与推荐信。

### 3. LeetCode 刷题（`?tab=practice`）
| 模式 | 作用 |
|------|------|
| **按岗位** | 按赛道浏览：前端、后端、全栈、移动端、数据/ML、运维/SRE、通用开发、**SQL / Supabase** |
| **按 JD** | AI 识别岗位赛道，从题库推荐 8–10 道该练的题（含优先级与理由） |

- **LeetCode** 题可外链打开；点 **练习** 可在站内查看并标记完成（存在本地）。
- **SQL / Supabase** 题含题干 + starter SQL，对着本项目真实表在 Supabase SQL Editor 里练。
- 加题：`lib/leetcode-catalog.ts`（LeetCode）或 `lib/practice-problems-supabase.ts`（站内 SQL）。说明见 `lib/practice-problem-types.ts` 注释。

左侧：岗位分类 + JD 推荐历史。

---

## 数据与隔离

| 表 | 用途 |
|----|------|
| `resume_history` | 排版简历 JSON、面试标记、语言 |
| `interview_prep_history` | JD、题目、匹配、推荐信、关联简历 |
| `practice_history` | 按 JD 的 LeetCode 推荐结果 |

- **设备隔离：** 浏览器 `device_id`（MVP 无需登录）
- **环境隔离：** `dev` / `prod`，本地与线上正式环境历史分开
- **软删除：** `deleted_at`，列表接口不返回已删记录

环境判定顺序：`APP_ENV` / `NEXT_PUBLIC_APP_ENV` → `VERCEL_ENV === 'production'` → 否则按 `NODE_ENV`。

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# 大模型（OpenAI 兼容；DeepSeek 示例）
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 可选：强制历史环境
# APP_ENV=dev
```

### 3. 数据库

在 Supabase SQL Editor 中执行：

- **新项目：** 运行 `supabase/schema.sql`
- **已有表：** 按需执行 `supabase/` 下增量迁移：
  - `migration_add_language.sql`
  - `migration_add_interview_markers.sql`
  - `migration_add_interview_prep_history.sql`
  - `migration_add_soft_delete.sql`
  - `migration_add_env.sql`
  - `migration_add_cover_letter.sql`
  - `migration_add_practice_history.sql`

### 4. 启动

```bash
npm run dev
```

- 首页：[http://localhost:3000](http://localhost:3000)
- 工作区：[http://localhost:3000/pages](http://localhost:3000/pages)

```bash
npm run build && npm start   # 本地生产模式
```

---

## 目录结构（简要）

```
app/
  page.tsx                 # 首页 / 欢迎页
  pages/page.tsx           # 工作区壳层
  components/              # 简历、面试、刷题与历史面板
  api/                     # AI 与历史相关接口
lib/                       # schema、题库、i18n、主题、Supabase
supabase/                  # 完整 schema 与迁移
```

### 主要 API

| 路由 | 作用 |
|------|------|
| `/api/extract-text` | 从上传文件提取简历文本 |
| `/api/format-resume` | AI 简历排版（可选 PDF 模板） |
| `/api/analyze-resume-template` | 从上传的 PDF 模板文本推断名称/版式 |
| `/api/resume-interview` | 简历面试标记 |
| `/api/resume-history` | 简历历史（软删除） |
| `/api/generate` | 根据 JD 生成 15 道面试题 |
| `/api/jd-match` | JD × 简历匹配分析 |
| `/api/cover-letter` | 新西兰风格推荐信 |
| `/api/interview-prep-history` | 面试准备历史 |
| `/api/practice-recommend` | 根据 JD 推荐 LeetCode |
| `/api/practice-history` | 刷题推荐历史 |

---

## TODO / 路线图

对照常见「付费简历产品」能力（排版 Builder、ATS、求职套件）的缺口。  
优先级：**P0** 先做 · **P1** 其次 · **P2** 更后。

### 简历工具

- [ ] **P0 — ATS / ResumeCheck（简历体检）**  
  不依赖 JD：可解析性、缺章节、联系方式/日期、弱动词、ATS 友好排版建议，可选分数。与现有 **JD × 简历匹配** 不同（匹配要对某一份 JD）。
- [ ] **P0 — Word（.docx）导出**  
  在 PDF / 复制文本之外支持 Word 下载。
- [ ] **P1 — 专家文案 / 内容建议**  
  摘要、经历要点的可插入短语库（可按岗位）。
- [ ] **P1 — 更多专业模板**  
  在现有主题选择之外扩充版式（含更偏 ATS 的简洁版）。
- [x] **PDF 简历模板** *(已完成)*  
  上传简历 PDF 作模板 → AI 排版把你的内容填进该结构/风格。
- [ ] **P1 — 更强的「分步 Builder」体验**  
  按章节逐步编辑（不仅是粘贴 → AI 排版），同时保留 AI 路径。
- [ ] **P2 — 明确的「ATS Friendly」模板模式**  
  单栏、标准标题、保证文字可选中可解析。

### 求职工具

- [ ] **P2 — 在线职业主页 / Profile**  
  可分享的公开链接或迷你主页（类似 Bold.pro 一类托管）。
- [ ] **P2 — 职位板 / 一键投递**  
  精选或合作职位 + 快速投递（范围大）。

### 已具备（无需再列 TODO）

| 对方常见能力 | 我们现状 |
|-------------|----------|
| 简历 Builder（部分） | AI 排版 + 同步 + 历史 |
| Cover Letter | Prep 里的新西兰推荐信 |
| TXT 下载 | 复制文本 |
| PDF 下载 | 下载 PDF |
| 面试准备 | 15 题、JD 匹配、推荐信、LeetCode / SQL 刷题 |

---

## 部署说明

- 可部署到 Vercel 等平台，在控制台配置与本地相同的环境变量。
- Vercel Production 默认将历史写入 `env = prod`（`VERCEL_ENV=production`）。
- Preview / 本地默认为 `dev`，也可用 `APP_ENV` 覆盖。

---

## 许可证

私有项目——可按你的用途自行调整。
