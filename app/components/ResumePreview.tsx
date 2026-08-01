import type { ReactNode } from 'react';
import InterviewMarkerBadge from '@/app/components/InterviewMarkerBadge';
import {
  DEFAULT_RESUME_LANGUAGE,
  getSectionLabels,
  type ResumeLanguageCode,
} from '@/lib/resume-languages';
import {
  markersForTarget,
  type ResumeInterviewMarker,
} from '@/lib/resume-interview';
import type { ResumeTemplate } from '@/lib/resume-template';
import {
  buildResumeTheme,
  DEFAULT_COLOR_PRESET_ID,
  DEFAULT_RESUME_LAYOUT,
  type ResumeLayoutId,
  type ResumeTheme,
} from '@/lib/resume-themes';

type Props = {
  resume: Partial<ResumeTemplate> | undefined;
  language?: ResumeLanguageCode;
  layout?: ResumeLayoutId;
  colorPresetId?: string;
  background?: string;
  accent?: string;
  markers?: ResumeInterviewMarker[];
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
};

const fontStack =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif';

function contactItems(resume: Partial<ResumeTemplate>): string[] {
  const contact = resume.contact;
  return [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.linkedin,
    contact?.github,
  ].filter((item): item is string => Boolean(item));
}

function MarkerRow({
  markers,
  accent,
  onMarkerClick,
  children,
  className = '',
}: {
  markers: ResumeInterviewMarker[];
  accent: string;
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative pr-6 ${className}`}>
      {children}
      {markers.length > 0 && (
        <div className="absolute right-0 top-0 flex flex-col gap-1 print:hidden">
          {markers.map((marker, markerIndex) => (
            <InterviewMarkerBadge
              key={`${marker.section}-${marker.groupIndex}-${marker.itemIndex ?? -1}-${marker.id}-${markerIndex}`}
              id={marker.id}
              accent={accent}
              onClick={() => onMarkerClick?.(marker)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  children,
  theme,
  layout,
}: {
  children: string;
  theme: ResumeTheme;
  layout: ResumeLayoutId;
}) {
  if (layout === 'timeline') {
    return (
      <h3
        className="text-xs font-semibold tracking-wider uppercase mb-3 pl-3"
        style={{ color: theme.accent, borderLeft: `3px solid ${theme.accent}` }}
      >
        {children}
      </h3>
    );
  }

  return (
    <h3
      className="text-xs font-semibold tracking-wider uppercase mb-2 pb-1"
      style={{ color: theme.muted, borderBottom: `1px solid ${theme.accent}33` }}
    >
      {children}
    </h3>
  );
}

function SkillsBlock({
  resume,
  theme,
  markers,
  onMarkerClick,
  sidebar,
}: {
  resume: Partial<ResumeTemplate>;
  theme: ResumeTheme;
  markers?: ResumeInterviewMarker[];
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
  sidebar?: boolean;
}) {
  if (!resume.skills?.length) return null;
  return (
    <ul className={sidebar ? 'space-y-2 text-xs' : 'space-y-1.5 text-sm'}>
      {resume.skills.map((group, index) => {
        if (!group) return null;
        const rowMarkers = markersForTarget(markers, 'skill', index, -1);
        return (
          <li key={`${group.category ?? 'skill'}-${index}`}>
            <MarkerRow
              markers={rowMarkers}
              accent={sidebar ? '#ffffff' : theme.accent}
              onMarkerClick={onMarkerClick}
            >
              {group.category && (
                <span
                  className="font-semibold"
                  style={{ color: sidebar ? '#ffffff' : theme.text }}
                >
                  {group.category}
                  {sidebar ? '' : ': '}
                </span>
              )}
              <span style={{ color: sidebar ? 'rgba(255,255,255,0.9)' : theme.muted }}>
                {sidebar ? (
                  <span className="block mt-0.5">
                    {(group.items ?? []).filter(Boolean).join(' · ')}
                  </span>
                ) : (
                  (group.items ?? []).filter(Boolean).join(' · ')
                )}
              </span>
            </MarkerRow>
          </li>
        );
      })}
    </ul>
  );
}

function ExperienceBlock({
  resume,
  theme,
  labelsExperience,
  markers,
  onMarkerClick,
}: {
  resume: Partial<ResumeTemplate>;
  theme: ResumeTheme;
  labelsExperience: string;
  markers?: ResumeInterviewMarker[];
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
}) {
  if (!resume.experience?.length) return null;
  return (
    <section className="mb-6">
      <SectionTitle theme={theme} layout={theme.layout}>
        {labelsExperience}
      </SectionTitle>
      <div className="space-y-5">
        {resume.experience.map((job, index) =>
          job ? (
            <div key={`exp-${index}-${job.company ?? 'job'}-${job.role ?? 'role'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-semibold" style={{ color: theme.text }}>
                  {job.role}{' '}
                  {job.company && (
                    <span className="font-normal" style={{ color: theme.muted }}>
                      — {job.company}
                    </span>
                  )}
                </p>
                {job.period && (
                  <p className="text-sm" style={{ color: theme.muted }}>
                    {job.period}
                  </p>
                )}
              </div>
              {job.location && (
                <p className="text-sm mb-2" style={{ color: theme.muted }}>
                  {job.location}
                </p>
              )}
              {job.bullets && job.bullets.length > 0 && (
                <ul
                  className="list-disc list-outside ml-5 space-y-2 text-sm"
                  style={{ color: theme.text }}
                >
                  {job.bullets.map((bullet, bIdx) => {
                    if (!bullet) return null;
                    const rowMarkers = markersForTarget(
                      markers,
                      'experience',
                      index,
                      bIdx
                    );
                    return (
                      <li key={bIdx} className="leading-relaxed">
                        <MarkerRow
                          markers={rowMarkers}
                          accent={theme.accent}
                          onMarkerClick={onMarkerClick}
                        >
                          {bullet}
                        </MarkerRow>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null
        )}
      </div>
    </section>
  );
}

function EducationBlock({
  resume,
  theme,
  label,
}: {
  resume: Partial<ResumeTemplate>;
  theme: ResumeTheme;
  label: string;
}) {
  if (!resume.education?.length) return null;
  return (
    <section className="mb-6">
      <SectionTitle theme={theme} layout={theme.layout}>
        {label}
      </SectionTitle>
      {resume.education.map((ed, index) =>
        ed ? (
          <div
            key={`${ed.school ?? 'school'}-${index}`}
            className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2"
          >
            <p className="text-sm" style={{ color: theme.text }}>
              {ed.degree && <span className="font-semibold">{ed.degree}</span>}
              {ed.school && (
                <span style={{ color: theme.muted }}> — {ed.school}</span>
              )}
            </p>
            {ed.period && (
              <p className="text-sm" style={{ color: theme.muted }}>
                {ed.period}
              </p>
            )}
          </div>
        ) : null
      )}
    </section>
  );
}

function ProjectsBlock({
  resume,
  theme,
  label,
  markers,
  onMarkerClick,
}: {
  resume: Partial<ResumeTemplate>;
  theme: ResumeTheme;
  label: string;
  markers?: ResumeInterviewMarker[];
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
}) {
  if (!resume.projects?.length) return null;
  return (
    <section>
      <SectionTitle theme={theme} layout={theme.layout}>
        {label}
      </SectionTitle>
      <div className="space-y-4">
        {resume.projects.map((project, index) => {
          if (!project) return null;
          const rowMarkers = markersForTarget(markers, 'project', index, -1);
          return (
            <div key={`${project.name ?? 'project'}-${index}`}>
              <MarkerRow
                markers={rowMarkers}
                accent={theme.accent}
                onMarkerClick={onMarkerClick}
              >
                {project.name && (
                  <p className="font-semibold text-sm" style={{ color: theme.text }}>
                    {project.name}
                  </p>
                )}
                {project.description && (
                  <p
                    className="text-sm mt-0.5 leading-relaxed"
                    style={{ color: theme.text }}
                  >
                    {project.description}
                  </p>
                )}
                {project.tech && (
                  <p className="text-xs mt-1" style={{ color: theme.muted }}>
                    {project.tech}
                  </p>
                )}
              </MarkerRow>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ResumePreview({
  resume,
  language = DEFAULT_RESUME_LANGUAGE,
  layout = DEFAULT_RESUME_LAYOUT,
  colorPresetId = DEFAULT_COLOR_PRESET_ID,
  background,
  accent,
  markers,
  onMarkerClick,
}: Props) {
  if (!resume) return null;

  const labels = getSectionLabels(language);
  const theme = buildResumeTheme({ layout, presetId: colorPresetId, background, accent });
  const contacts = contactItems(resume);

  const shellClass =
    'border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none';

  const sharedBlocks = (
    <>
      <ExperienceBlock
        resume={resume}
        theme={theme}
        labelsExperience={labels.experience}
        markers={markers}
        onMarkerClick={onMarkerClick}
      />
      <EducationBlock resume={resume} theme={theme} label={labels.education} />
      <ProjectsBlock
        resume={resume}
        theme={theme}
        label={labels.projects}
        markers={markers}
        onMarkerClick={onMarkerClick}
      />
    </>
  );

  if (theme.layout === 'sidebar') {
    return (
      <article
        id="resume-print"
        className={`grid md:grid-cols-[240px_1fr] ${shellClass}`}
        style={{ fontFamily: fontStack, background: theme.background, color: theme.text }}
      >
        <aside className="p-6 md:p-7" style={{ background: theme.accent, color: '#f8fafc' }}>
          {resume.name && (
            <h2 className="text-2xl font-bold tracking-tight text-white">{resume.name}</h2>
          )}
          {resume.title && (
            <p className="text-sm mt-2 text-white/90 font-medium">{resume.title}</p>
          )}
          {contacts.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/70 mb-2">Contact</p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-white/95">
                {contacts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {resume.skills && resume.skills.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/70 mb-2">
                {labels.skills}
              </p>
              <SkillsBlock
                resume={resume}
                theme={theme}
                markers={markers}
                onMarkerClick={onMarkerClick}
                sidebar
              />
            </div>
          )}
        </aside>
        <div className="p-6 md:p-8">
          {resume.summary && (
            <section className="mb-6">
              <SectionTitle theme={theme} layout={theme.layout}>
                {labels.summary}
              </SectionTitle>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {resume.summary}
              </p>
            </section>
          )}
          {sharedBlocks}
        </div>
      </article>
    );
  }

  if (theme.layout === 'banner') {
    return (
      <article
        id="resume-print"
        className={shellClass}
        style={{ fontFamily: fontStack, background: theme.background, color: theme.text }}
      >
        <header className="px-6 md:px-10 py-7" style={{ background: theme.accent }}>
          {resume.name && (
            <h2 className="text-3xl font-bold tracking-tight text-white">{resume.name}</h2>
          )}
          {resume.title && (
            <p className="text-lg text-white/90 font-medium mt-1">{resume.title}</p>
          )}
          {contacts.length > 0 && (
            <p className="text-sm text-white/85 mt-3 leading-relaxed">
              {contacts.join(' · ')}
            </p>
          )}
        </header>
        <div className="p-6 md:p-10">
          {resume.summary && (
            <section className="mb-6">
              <SectionTitle theme={theme} layout={theme.layout}>
                {labels.summary}
              </SectionTitle>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {resume.summary}
              </p>
            </section>
          )}
          {resume.skills && resume.skills.length > 0 && (
            <section className="mb-6">
              <SectionTitle theme={theme} layout={theme.layout}>
                {labels.skills}
              </SectionTitle>
              <SkillsBlock
                resume={resume}
                theme={theme}
                markers={markers}
                onMarkerClick={onMarkerClick}
              />
            </section>
          )}
          {sharedBlocks}
        </div>
      </article>
    );
  }

  return (
    <article
      id="resume-print"
      className={`${shellClass} p-6 md:p-10`}
      style={{ fontFamily: fontStack, background: theme.background, color: theme.text }}
    >
      <header
        className="pb-5 mb-6"
        style={{
          borderBottom:
            theme.layout === 'timeline'
              ? `2px solid ${theme.accent}`
              : `1px solid ${theme.accent}33`,
        }}
      >
        {resume.name && (
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: theme.text }}>
            {resume.name}
          </h2>
        )}
        {resume.title && (
          <p className="text-lg font-medium mt-1" style={{ color: theme.accent }}>
            {resume.title}
          </p>
        )}
        {contacts.length > 0 && (
          <p className="text-sm mt-3 leading-relaxed" style={{ color: theme.muted }}>
            {contacts.join(' · ')}
          </p>
        )}
      </header>

      {resume.summary && (
        <section className="mb-6">
          <SectionTitle theme={theme} layout={theme.layout}>
            {labels.summary}
          </SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
            {resume.summary}
          </p>
        </section>
      )}

      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <SectionTitle theme={theme} layout={theme.layout}>
            {labels.skills}
          </SectionTitle>
          <SkillsBlock
            resume={resume}
            theme={theme}
            markers={markers}
            onMarkerClick={onMarkerClick}
          />
        </section>
      )}

      {sharedBlocks}
    </article>
  );
}
