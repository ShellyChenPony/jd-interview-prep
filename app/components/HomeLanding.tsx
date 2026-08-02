'use client';

import Link from 'next/link';
import { useAppLanguage } from '@/lib/app-language';
import { RESUME_LANGUAGES, type ResumeLanguageCode } from '@/lib/resume-languages';

function ProductMock() {
  return (
    <div
      aria-hidden
      className="home-mock relative mx-auto w-full max-w-4xl overflow-hidden rounded-t-[1.25rem] border border-[#c5d4e0] bg-[#f4f7fa] shadow-[0_24px_60px_-28px_rgba(15,39,68,0.45)]"
    >
      <div className="flex items-center gap-1.5 border-b border-[#d5e0ea] bg-[#e8eef4] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#c9d5e0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#c9d5e0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#c9d5e0]" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-[#5a6d7e]">
          workspace · resume · prep · drill
        </span>
      </div>
      <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[56px_140px_1fr]">
        <div className="flex flex-col items-center gap-2 border-r border-[#d5e0ea] bg-[#eef3f7] py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0f2744] text-[10px] font-bold text-white">
            AI
          </div>
          <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-white text-[9px] font-semibold text-[#0f2744] shadow-sm">
            <span className="text-xs font-bold">CV</span>
            <span className="opacity-70">Resume</span>
          </div>
          <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-[9px] font-semibold text-[#6b7c8c]">
            <span className="text-xs font-bold">Q</span>
            <span className="opacity-70">Prep</span>
          </div>
          <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-[9px] font-semibold text-[#6b7c8c]">
            <span className="text-xs font-bold">LC</span>
            <span className="opacity-70">Drill</span>
          </div>
        </div>
        <div className="hidden border-r border-[#d5e0ea] bg-[#f7fafc] p-3 sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8b9a]">
            History
          </p>
          <div className="mt-3 space-y-2">
            {['Senior FE · formatted', 'JD · 15 questions', 'NZ cover letter'].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#e0e8ef] bg-white px-2.5 py-2 text-[11px] text-[#334155]"
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>
        <div className="space-y-3 bg-white p-4 sm:p-6">
          <div className="h-3 w-28 rounded bg-[#0f766e]/60" />
          <div className="h-5 w-48 rounded bg-[#0f2744]/90" />
          <div className="space-y-2 pt-1">
            <div className="h-2.5 w-full rounded bg-[#e8eef4]" />
            <div className="h-2.5 w-[92%] rounded bg-[#e8eef4]" />
            <div className="h-2.5 w-[78%] rounded bg-[#e8eef4]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-2 rounded-xl border border-[#e5edf4] p-3">
              <div className="h-2 w-16 rounded bg-[#99b4c8]" />
              <div className="h-2 w-full rounded bg-[#eef3f7]" />
              <div className="h-2 w-[80%] rounded bg-[#eef3f7]" />
            </div>
            <div className="space-y-2 rounded-xl border border-[#e5edf4] p-3">
              <div className="h-2 w-20 rounded bg-[#0f766e]/50" />
              <div className="h-2 w-full rounded bg-[#eef3f7]" />
              <div className="h-2 w-[60%] rounded bg-[#eef3f7]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeLanding() {
  const { language, setLanguage, t } = useAppLanguage();

  const features = [
    {
      n: '01',
      title: t.homeFeatureResumeTitle,
      body: t.homeFeatureResumeBody,
      href: '/pages?tab=resume',
    },
    {
      n: '02',
      title: t.homeFeatureQuestionsTitle,
      body: t.homeFeatureQuestionsBody,
      href: '/pages?tab=interview',
    },
    {
      n: '03',
      title: t.homeFeatureMatchTitle,
      body: t.homeFeatureMatchBody,
      href: '/pages?tab=interview',
    },
    {
      n: '04',
      title: t.homeFeatureCoverTitle,
      body: t.homeFeatureCoverBody,
      href: '/pages?tab=interview',
    },
    {
      n: '05',
      title: t.homeFeaturePracticeTitle,
      body: t.homeFeaturePracticeBody,
      href: '/pages?tab=practice',
    },
  ] as const;

  const steps = [
    { n: '1', title: t.homeStep1Title, body: t.homeStep1Body },
    { n: '2', title: t.homeStep2Title, body: t.homeStep2Body },
    { n: '3', title: t.homeStep3Title, body: t.homeStep3Body },
  ] as const;

  return (
    <div className="home-landing min-h-dvh overflow-y-auto bg-[#edf3f7] text-[#0f2744]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#c5e4e0_0%,transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_20%,#d4e4f4_0%,transparent_50%),linear-gradient(180deg,#e8f1f6_0%,#edf3f7_40%,#f5f8fa_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,39,68,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,39,68,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <header className="home-fade-in mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[#0f2744] sm:text-2xl"
        >
          {t.brand}
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-sm text-[#5a6d7e]">
            <span className="sr-only">{t.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as ResumeLanguageCode)}
              className="rounded-lg border border-[#c5d4e0] bg-white/80 px-2.5 py-1.5 text-sm text-[#0f2744] backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#0f766e]/40"
              aria-label={t.language}
            >
              {RESUME_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/pages"
            className="rounded-xl bg-[#0f2744] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#173556]"
          >
            {t.homeOpenApp}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl flex-col px-5 pb-0 pt-6 sm:px-8 sm:pt-10">
          <div className="home-fade-in-up mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
              {t.homeBadge}
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-[2.35rem] leading-[1.12] tracking-tight text-[#0f2744] sm:text-5xl md:text-[3.5rem]">
              {t.homeHeadline}{' '}
              <span className="text-[#0f766e]">{t.homeHeadlineAccent}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#3d5163] sm:text-lg">
              {t.homeSub}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <Link
                href="/pages?tab=resume"
                className="home-cta-primary rounded-xl bg-[#0f766e] px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#0d6560]"
              >
                {t.homeCtaResume}
              </Link>
              <Link
                href="/pages?tab=interview"
                className="rounded-xl border border-[#0f2744]/20 bg-white/70 px-6 py-3.5 text-center text-sm font-semibold text-[#0f2744] backdrop-blur transition hover:border-[#0f2744]/40 hover:bg-white"
              >
                {t.homeCtaPrep}
              </Link>
              <Link
                href="/pages?tab=practice"
                className="rounded-xl border border-[#0f2744]/20 bg-white/70 px-6 py-3.5 text-center text-sm font-semibold text-[#0f2744] backdrop-blur transition hover:border-[#0f2744]/40 hover:bg-white"
              >
                {t.homeCtaPractice}
              </Link>
            </div>
          </div>

          <div className="home-fade-in-up home-mock-wrap mt-12 flex flex-1 items-end justify-center sm:mt-16">
            <ProductMock />
          </div>
        </section>

        <section className="border-t border-[#0f2744]/08 bg-[#f7fafc]/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#0f2744] sm:text-4xl">
                {t.homeFeaturesTitle}
              </h2>
              <p className="mt-3 text-base text-[#5a6d7e]">{t.homeFeaturesSub}</p>
            </div>

            <ol className="mt-12 divide-y divide-[#0f2744]/10 border-y border-[#0f2744]/10">
              {features.map((feature) => (
                <li key={feature.n}>
                  <Link
                    href={feature.href}
                    className="group grid gap-3 py-7 transition sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-8"
                  >
                    <span className="font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums text-[#0f766e]">
                      {feature.n}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-[#0f2744] group-hover:text-[#0f766e]">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5a6d7e] sm:text-base">
                        {feature.body}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#0f766e] opacity-0 transition group-hover:opacity-100 sm:justify-self-end">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#0f2744] sm:text-4xl">
              {t.homeStepsTitle}
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {steps.map((step) => (
                <li key={step.n} className="relative">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-none text-[#0f766e]/25">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-[#0f2744]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5a6d7e]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-[#0f2744]/08 bg-[#0f2744] py-16 text-[#edf3f7]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
                {t.brand}
              </p>
              <p className="mt-2 max-w-md text-sm text-[#a8b8c8]">{t.homeFooterNote}</p>
            </div>
            <Link
              href="/pages"
              className="rounded-xl bg-[#0f766e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#12a193]"
            >
              {t.homeFooterCta}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
