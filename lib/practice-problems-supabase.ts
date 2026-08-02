import type { LeetCodeProblem } from '@/lib/practice-problem-types';

/**
 * In-app SQL / Supabase drills (no LeetCode link).
 * Run starter SQL in your Supabase SQL Editor against this project's tables.
 * Numbers use 9xxx to avoid colliding with LeetCode ids.
 */
export const SUPABASE_PRACTICE_PROBLEMS: LeetCodeProblem[] = [
  {
    id: 'sb-list-active-resumes',
    number: 9001,
    title: 'List active resume history',
    slug: 'sb-list-active-resumes',
    difficulty: 'Easy',
    tags: ['SQL', 'SELECT', 'Soft delete'],
    categories: ['supabase', 'backend', 'fullstack'],
    kind: 'supabase',
    promptEn:
      'Query resume_history for one device: return id, name, job_title, created_at for rows that are NOT soft-deleted, newest first, limit 20.',
    promptZh:
      '查询 resume_history：给定一个 device_id，返回未软删除的 id、name、job_title、created_at，按创建_at 倒序，最多 20 条。',
    starterSql: `-- replace the device id
select id, name, job_title, created_at
from public.resume_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
order by created_at desc
limit 20;`,
    hints: [
      'Soft delete uses deleted_at IS NULL',
      'Match the filter used by /api/resume-history',
    ],
    goalEn: 'Same filters as the Resume History list API.',
    goalZh: '过滤条件应与简历历史列表 API 一致。',
  },
  {
    id: 'sb-filter-by-env',
    number: 9002,
    title: 'Isolate history by env',
    slug: 'sb-filter-by-env',
    difficulty: 'Easy',
    tags: ['SQL', 'env', 'Isolation'],
    categories: ['supabase', 'backend', 'devops'],
    kind: 'supabase',
    promptEn:
      'For interview_prep_history, count rows per env (dev/prod) for a device, only active (not deleted) rows.',
    promptZh:
      '对 interview_prep_history：按 env（dev/prod）统计某 device 下未删除行的数量。',
    starterSql: `select env, count(*) as cnt
from public.interview_prep_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
group by env
order by env;`,
    hints: ['GROUP BY env', 'Always filter deleted_at'],
    goalEn: 'Understand why local and production lists stay separate.',
    goalZh: '理解本地与线上历史为何互不干扰。',
  },
  {
    id: 'sb-soft-delete-resume',
    number: 9003,
    title: 'Soft-delete a resume row',
    slug: 'sb-soft-delete-resume',
    difficulty: 'Easy',
    tags: ['SQL', 'UPDATE', 'Soft delete'],
    categories: ['supabase', 'backend', 'fullstack'],
    kind: 'supabase',
    promptEn:
      'Soft-delete one resume_history row by id + device_id (set deleted_at = now()). Do not hard DELETE.',
    promptZh:
      '按 id + device_id 软删除一条 resume_history（设置 deleted_at = now()），不要物理 DELETE。',
    starterSql: `update public.resume_history
set deleted_at = now()
where id = 'RESUME_UUID'
  and device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
returning id, deleted_at;`,
    hints: ['Prefer UPDATE over DELETE', 'Guard with deleted_at is null'],
    goalEn: 'Mirror /api/resume-history DELETE behavior.',
    goalZh: '行为应对齐简历历史 DELETE 接口。',
  },
  {
    id: 'sb-join-prep-resume',
    number: 9004,
    title: 'Join prep sessions to resumes',
    slug: 'sb-join-prep-resume',
    difficulty: 'Medium',
    tags: ['SQL', 'JOIN', 'NULL'],
    categories: ['supabase', 'backend', 'data'],
    kind: 'supabase',
    promptEn:
      'List interview_prep_history rows with their linked resume name (left join resume_history). Include sessions with no resume. Active rows only.',
    promptZh:
      '列出 interview_prep_history，并 LEFT JOIN resume_history 显示关联简历 name；没有关联简历的也要保留。只含未删除行。',
    starterSql: `select
  p.id as prep_id,
  p.jd_title,
  p.resume_label,
  r.name as resume_name,
  p.updated_at
from public.interview_prep_history p
left join public.resume_history r
  on r.id = p.resume_history_id
 and r.deleted_at is null
where p.device_id = 'YOUR_DEVICE_ID'
  and p.deleted_at is null
order by p.updated_at desc
limit 30;`,
    hints: ['LEFT JOIN keeps prep rows without resume', 'Filter both tables carefully'],
    goalEn: 'Practice joins like Prep ↔ Resume relationship.',
    goalZh: '练习 Prep 与 Resume 的关联查询。',
  },
  {
    id: 'sb-cover-letter-present',
    number: 9005,
    title: 'Find sessions with a cover letter',
    slug: 'sb-cover-letter-present',
    difficulty: 'Easy',
    tags: ['SQL', 'JSONB', 'IS NOT NULL'],
    categories: ['supabase', 'backend', 'fullstack'],
    kind: 'supabase',
    promptEn:
      'Return prep sessions that have cover_letter_json set (not null), for a device + env.',
    promptZh:
      '查出某 device + env 下 cover_letter_json 非空的面试准备记录。',
    starterSql: `select id, jd_title, updated_at
from public.interview_prep_history
where device_id = 'YOUR_DEVICE_ID'
  and env = 'dev'
  and deleted_at is null
  and cover_letter_json is not null
order by updated_at desc;`,
    hints: ['JSONB null check uses IS NOT NULL'],
    goalEn: 'Filter on optional JSON columns.',
    goalZh: '练习可选 JSON 字段的过滤。',
  },
  {
    id: 'sb-practice-recommend-count',
    number: 9006,
    title: 'Count problems inside recommend_json',
    slug: 'sb-practice-recommend-count',
    difficulty: 'Medium',
    tags: ['SQL', 'JSONB', 'jsonb_array_length'],
    categories: ['supabase', 'backend', 'data'],
    kind: 'supabase',
    promptEn:
      'From practice_history, show jd_title and how many items are in recommend_json->recommendations (json array). Active rows only.',
    promptZh:
      '从 practice_history 取出 jd_title，以及 recommend_json->recommendations 数组长度。仅未删除行。',
    starterSql: `select
  id,
  jd_title,
  jsonb_array_length(
    coalesce(recommend_json->'recommendations', '[]'::jsonb)
  ) as recommendation_count,
  updated_at
from public.practice_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
order by updated_at desc;`,
    hints: ['Use -> for JSON object fields', 'coalesce empty array to avoid null length'],
    goalEn: 'Read nested JSONB used by the Drill tab.',
    goalZh: '读取刷题 Tab 使用的嵌套 JSONB。',
  },
  {
    id: 'sb-rls-mental-model',
    number: 9007,
    title: 'RLS mental model (read + design)',
    slug: 'sb-rls-mental-model',
    difficulty: 'Medium',
    tags: ['RLS', 'Security', 'Design'],
    categories: ['supabase', 'backend', 'devops'],
    kind: 'supabase',
    promptEn:
      'This app currently uses the service role on the server (RLS enabled, no anon policies). Write a SELECT policy sketch so an authenticated user can only read their own resume_history rows (auth.uid()::text = user_id). You do not need to run it yet — paste your policy SQL into starter and refine.',
    promptZh:
      '本项目目前用服务端 service role（RLS 已开但无 anon 策略）。请草拟一条 SELECT 策略：登录用户只能读自己的 resume_history（假设有 user_id = auth.uid()::text）。先写在 starter 里，不必立刻上线。',
    starterSql: `-- design exercise — adjust when you add Auth + user_id
-- alter table public.resume_history add column if not exists user_id uuid references auth.users;

create policy "resume_select_own"
on public.resume_history
for select
to authenticated
using (user_id = auth.uid());

-- Also think: INSERT / UPDATE / soft-delete policies`,
    hints: [
      'Service role bypasses RLS — browser anon/authenticated does not',
      'MVP uses device_id; Auth migration would use user_id',
    ],
    goalEn: 'Understand why server APIs use the service role today.',
    goalZh: '理解当前为何 API 使用 service role。',
  },
  {
    id: 'sb-index-check',
    number: 9008,
    title: 'Verify useful indexes exist',
    slug: 'sb-index-check',
    difficulty: 'Easy',
    tags: ['SQL', 'Indexes', 'pg_indexes'],
    categories: ['supabase', 'backend', 'devops'],
    kind: 'supabase',
    promptEn:
      'List indexes on resume_history and interview_prep_history. Confirm you see device/env/active style indexes from schema.sql.',
    promptZh:
      '列出 resume_history 与 interview_prep_history 上的索引，确认存在 schema.sql 里的 device/env/active 类索引。',
    starterSql: `select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('resume_history', 'interview_prep_history', 'practice_history')
order by tablename, indexname;`,
    hints: ['pg_indexes is the quick catalog view'],
    goalEn: 'Connect schema migrations to real DB indexes.',
    goalZh: '把迁移文件和真实索引对应起来。',
  },
  {
    id: 'sb-upsert-practice-title',
    number: 9009,
    title: 'Trim long JD titles',
    slug: 'sb-upsert-practice-title',
    difficulty: 'Easy',
    tags: ['SQL', 'UPDATE', 'string'],
    categories: ['supabase', 'backend', 'fullstack'],
    kind: 'supabase',
    promptEn:
      'Update practice_history.jd_title to left(jd_title, 120) where length(jd_title) > 120. Preview with SELECT first.',
    promptZh:
      '先 SELECT 出 jd_title 长度 > 120 的行，再 UPDATE 截断为 120 字符（与 deriveJdTitle 一致）。',
    starterSql: `-- preview
select id, length(jd_title) as len, left(jd_title, 40) as preview
from public.practice_history
where length(jd_title) > 120;

-- then update if needed
-- update public.practice_history
-- set jd_title = left(jd_title, 120)
-- where length(jd_title) > 120;`,
    hints: ['Always SELECT before bulk UPDATE'],
    goalEn: 'Safe data cleanup habits.',
    goalZh: '养成先查后改的习惯。',
  },
  {
    id: 'sb-weekly-activity',
    number: 9010,
    title: 'Weekly activity across tables',
    slug: 'sb-weekly-activity',
    difficulty: 'Medium',
    tags: ['SQL', 'UNION', 'Aggregate'],
    categories: ['supabase', 'data', 'backend'],
    kind: 'supabase',
    promptEn:
      'For one device, count how many resume / prep / practice rows were created in the last 7 days (ignore soft-deleted). Return three rows with a source label.',
    promptZh:
      '统计某 device 近 7 天新建的 resume / prep / practice 条数（忽略已软删），用 UNION 返回三行并带 source 标签。',
    starterSql: `select 'resume' as source, count(*)::int as cnt
from public.resume_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
  and created_at >= now() - interval '7 days'
union all
select 'prep', count(*)::int
from public.interview_prep_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
  and created_at >= now() - interval '7 days'
union all
select 'practice', count(*)::int
from public.practice_history
where device_id = 'YOUR_DEVICE_ID'
  and deleted_at is null
  and created_at >= now() - interval '7 days';`,
    hints: ['UNION ALL keeps three rows', 'interval arithmetic on timestamptz'],
    goalEn: 'Cross-table analytics on your own product data.',
    goalZh: '用自己的产品数据做跨表统计。',
  },
];
