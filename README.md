# AI Remote Job Prep

[中文说明](./README.zh-CN.md)

An AI workspace for remote job hunting: polish a resume, prep from a real JD, practice LeetCode by role, and draft a New Zealand–style cover letter — in one place.

**Stack:** Next.js 16 · React 19 · Vercel AI SDK · OpenAI-compatible LLM (e.g. DeepSeek) · Supabase · Tailwind CSS v4

---

## Features

### Home (`/`)
Welcome page that explains the product and routes new users into the workspace:
- Format resume
- Prep from a JD
- Start LeetCode drilling

Language switch (English / 简体中文) on the home page carries into the app.

### Workspace (`/pages`)
Three-column shell:
- **Left rail** — Home (AI logo), Resume, Prep, Drill
- **Middle** — History / categories for the active tab
- **Right** — Main workspace

Top-right: **language** (en / zh-CN) and **theme** (light / dark). AI copy and UI follow the selected language.

---

### 1. Resume Template (`?tab=resume`)
- Upload PDF / Word / text, or paste resume content
- **Format with AI** into a structured, printable template
- **Sync edits** from the text box into the formatted resume without another AI call
- **Interview markers** — generate Q-style anchors on the resume with sample answers and review links
- Export: copy as text, print, download PDF
- **Resume History** — save, reopen, soft-delete

### 2. Interview Prep (`?tab=interview`)
Paste a Job Description, then use three tools (results share one Prep History session):

| Tool | What it does |
|------|----------------|
| **15 Questions** | High-frequency interview questions with intent, sample answers, tips, and review links |
| **JD × Resume** | Fit score, strong matches, gaps, and an improvement plan (uses a resume from history) |
| **Cover Letter** | NZ-style cover / recommendation letter from JD + resume; copy-ready body + tips |

**Prep History** stores JD, questions, match analysis, and cover letter together.

### 3. LeetCode Practice (`?tab=practice`)
| Mode | What it does |
|------|----------------|
| **By role** | Browse curated LeetCode sets by track: Frontend, Backend, Full Stack, Mobile, Data/ML, DevOps/SRE, General SWE |
| **From JD** | AI maps the JD to a track and recommends 8–10 catalog problems with priority and reasons (opens on leetcode.com) |

Left panel: job-role categories + saved JD recommendation history.

---

## Data & isolation

| Table | Purpose |
|-------|---------|
| `resume_history` | Formatted resume JSON, interview markers, language |
| `interview_prep_history` | JD, questions, match, cover letter, linked resume |
| `practice_history` | JD-based LeetCode recommendations |

- **Device:** browser `device_id` (no login required for MVP)
- **Environment:** `dev` / `prod` column so local and Vercel Production don’t share history lists
- **Soft delete:** `deleted_at` — list APIs hide deleted rows

Env resolution for history: `APP_ENV` / `NEXT_PUBLIC_APP_ENV` → `VERCEL_ENV === 'production'` → else `NODE_ENV`.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
# LLM (OpenAI-compatible; DeepSeek example)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional: force history env
# APP_ENV=dev
```

### 3. Database

In the Supabase SQL Editor, run either:

- **`supabase/schema.sql`** — full schema for a new project, or
- Incremental migrations under `supabase/` if tables already exist:
  - `migration_add_language.sql`
  - `migration_add_interview_markers.sql`
  - `migration_add_interview_prep_history.sql`
  - `migration_add_soft_delete.sql`
  - `migration_add_env.sql`
  - `migration_add_cover_letter.sql`
  - `migration_add_practice_history.sql`

### 4. Run

```bash
npm run dev
```

- Home: [http://localhost:3000](http://localhost:3000)
- Workspace: [http://localhost:3000/pages](http://localhost:3000/pages)

```bash
npm run build && npm start   # production locally
```

---

## Project layout (high level)

```
app/
  page.tsx                 # Home / landing
  pages/page.tsx           # Workspace shell
  components/              # Resume, Prep, Practice, history panels
  api/                     # AI + history APIs
lib/                       # schemas, catalogs, i18n, theme, supabase
supabase/                  # schema + migrations
```

### Main APIs

| Route | Role |
|-------|------|
| `/api/extract-text` | Extract text from uploaded resume files |
| `/api/format-resume` | AI resume formatting |
| `/api/resume-interview` | Interview markers on resume |
| `/api/resume-history` | Resume history CRUD (soft delete) |
| `/api/generate` | 15 interview questions from JD |
| `/api/jd-match` | JD × resume fit analysis |
| `/api/cover-letter` | NZ cover letter |
| `/api/interview-prep-history` | Prep history |
| `/api/practice-recommend` | LeetCode recommendations from JD |
| `/api/practice-history` | Practice recommendation history |

---

## Deploy notes

- Deploy on Vercel (or similar). Set the same env vars in the host dashboard.
- Production deployments use `env = prod` for history by default (`VERCEL_ENV=production`).
- Preview / local use `dev` unless you override `APP_ENV`.

---

## License

Private project — adjust as needed for your use.
