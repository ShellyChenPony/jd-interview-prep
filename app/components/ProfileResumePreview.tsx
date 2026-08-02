'use client';

import type { ReactNode } from 'react';
import InterviewMarkerBadge from '@/app/components/InterviewMarkerBadge';
import {
  getSectionLabels,
  type ResumeLanguageCode,
} from '@/lib/resume-languages';
import {
  markersForTarget,
  type ResumeInterviewMarker,
} from '@/lib/resume-interview';
import type { PdfLayoutProfile, SectionId } from '@/lib/pdf-layout-profile';
import type { ResumeTemplate } from '@/lib/resume-template';
import type { ResumeTheme } from '@/lib/resume-themes';

const fontStack =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif';

type Props = {
  resume: Partial<ResumeTemplate>;
  language: ResumeLanguageCode;
  theme: ResumeTheme;
  profile: PdfLayoutProfile;
  markers?: ResumeInterviewMarker[];
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
};

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
}: {
  markers: ResumeInterviewMarker[];
  accent: string;
  onMarkerClick?: (marker: ResumeInterviewMarker) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative pr-6">
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

function ProfileSectionTitle({
  children,
  theme,
  style,
}: {
  children: string;
  theme: ResumeTheme;
  style: PdfLayoutProfile['sectionTitleStyle'];
}) {
  if (style === 'accent-bar') {
    return (
      <h3
        className="text-xs font-semibold tracking-wider uppercase mb-3 pl-3"
        style={{ color: theme.accent, borderLeft: `3px solid ${theme.accent}` }}
      >
        {children}
      </h3>
    );
  }
  if (style === 'plain-caps') {
    return (
      <h3
        className="text-xs font-semibold tracking-[0.14em] uppercase mb-2"
        style={{ color: theme.accent }}
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

function densityClass(density: PdfLayoutProfile['density']): string {
  if (density === 'compact') return 'space-y-3';
  if (density === 'spacious') return 'space-y-7';
  return 'space-y-5';
}

function padClass(density: PdfLayoutProfile['density']): string {
  if (density === 'compact') return 'p-5 md:p-6';
  if (density === 'spacious') return 'p-7 md:p-11';
  return 'p-6 md:p-9';
}

function nameClass(size: PdfLayoutProfile['nameSize']): string {
  if (size === 'xl') return 'text-4xl font-bold tracking-tight';
  if (size === 'md') return 'text-2xl font-bold tracking-tight';
  return 'text-3xl font-bold tracking-tight';
}

function sidebarColClass(width: PdfLayoutProfile['sidebarWidth']): string {
  if (width === 'narrow') return 'md:grid-cols-[180px_1fr]';
  if (width === 'wide') return 'md:grid-cols-[280px_1fr]';
  return 'md:grid-cols-[220px_1fr]';
}

export default function ProfileResumePreview({
  resume,
  language,
  theme,
  profile,
  markers,
  onMarkerClick,
}: Props) {
  const labels = getSectionLabels(language);
  const contacts = contactItems(resume);
  const shellClass =
    'border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none';
  const hasSidebar =
    profile.columns === 'sidebar-left' || profile.columns === 'sidebar-right';

  const titleStyle = profile.sectionTitleStyle;
  const showSkillsInMain =
    profile.skillsPlacement === 'main' || profile.skillsPlacement === 'both';
  const showSkillsInSidebar =
    hasSidebar &&
    (profile.skillsPlacement === 'sidebar' ||
      profile.skillsPlacement === 'both' ||
      profile.sidebarSections.includes('skills'));
  const showContactInSidebar =
    hasSidebar &&
    (profile.contactPlacement === 'sidebar' ||
      profile.sidebarSections.includes('contact'));
  const showContactInHeader =
    !showContactInSidebar &&
    (profile.contactPlacement === 'header' ||
      profile.contactPlacement === 'below-name');

  const renderSkills = (sidebar?: boolean) => {
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
                <span
                  style={{
                    color: sidebar ? 'rgba(255,255,255,0.9)' : theme.muted,
                  }}
                >
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
  };

  const renderExperience = () => {
    if (!resume.experience?.length) return null;
    return (
      <section>
        <ProfileSectionTitle theme={theme} style={titleStyle}>
          {labels.experience}
        </ProfileSectionTitle>
        <div className={densityClass(profile.density)}>
          {resume.experience.map((job, index) =>
            job ? (
              <div key={`exp-${index}-${job.company ?? 'job'}`}>
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
                    className="list-disc list-outside ml-5 space-y-1.5 text-sm"
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
  };

  const renderEducation = (sidebar?: boolean) => {
    if (!resume.education?.length) return null;
    if (sidebar) {
      return (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/70 mb-2">
            {labels.education}
          </p>
          <ul className="space-y-2 text-xs text-white/95">
            {resume.education.map((ed, index) =>
              ed ? (
                <li key={`${ed.school ?? 'school'}-${index}`}>
                  <span className="font-semibold text-white">{ed.degree}</span>
                  {ed.school && <span className="block mt-0.5">{ed.school}</span>}
                  {ed.period && (
                    <span className="block text-white/70">{ed.period}</span>
                  )}
                </li>
              ) : null
            )}
          </ul>
        </div>
      );
    }
    return (
      <section>
        <ProfileSectionTitle theme={theme} style={titleStyle}>
          {labels.education}
        </ProfileSectionTitle>
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
  };

  const renderProjects = () => {
    if (!resume.projects?.length) return null;
    return (
      <section>
        <ProfileSectionTitle theme={theme} style={titleStyle}>
          {labels.projects}
        </ProfileSectionTitle>
        <div className={densityClass(profile.density)}>
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
                    <p
                      className="font-semibold text-sm"
                      style={{ color: theme.text }}
                    >
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
  };

  const renderSummary = (sidebar?: boolean) => {
    if (!resume.summary) return null;
    if (sidebar) {
      return (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/70 mb-2">
            {labels.summary}
          </p>
          <p className="text-xs leading-relaxed text-white/95">{resume.summary}</p>
        </div>
      );
    }
    return (
      <section>
        <ProfileSectionTitle theme={theme} style={titleStyle}>
          {labels.summary}
        </ProfileSectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
          {resume.summary}
        </p>
      </section>
    );
  };

  const renderMainSection = (id: SectionId) => {
    switch (id) {
      case 'summary':
        if (profile.sidebarSections.includes('summary') && hasSidebar) return null;
        return renderSummary(false);
      case 'skills':
        if (!showSkillsInMain) return null;
        if (!resume.skills?.length) return null;
        return (
          <section>
            <ProfileSectionTitle theme={theme} style={titleStyle}>
              {labels.skills}
            </ProfileSectionTitle>
            {renderSkills(false)}
          </section>
        );
      case 'experience':
        return renderExperience();
      case 'education':
        if (profile.sidebarSections.includes('education') && hasSidebar) return null;
        return renderEducation(false);
      case 'projects':
        return renderProjects();
      default:
        return null;
    }
  };

  const mainStack = (
    <div className={`${densityClass(profile.density)} ${padClass(profile.density)}`}>
      {profile.mainSectionOrder.map((id) => (
        <div key={id}>{renderMainSection(id)}</div>
      ))}
    </div>
  );

  const nameBlock = (light?: boolean) => (
    <>
      {resume.name && (
        <h2
          className={nameClass(profile.nameSize)}
          style={{ color: light ? '#ffffff' : theme.text }}
        >
          {resume.name}
        </h2>
      )}
      {resume.title && (
        <p
          className="text-lg font-medium mt-1"
          style={{ color: light ? 'rgba(255,255,255,0.9)' : theme.accent }}
        >
          {resume.title}
        </p>
      )}
    </>
  );

  const contactLine = (light?: boolean) =>
    showContactInHeader && contacts.length > 0 ? (
      <p
        className="text-sm mt-3 leading-relaxed"
        style={{ color: light ? 'rgba(255,255,255,0.85)' : theme.muted }}
      >
        {contacts.join(' · ')}
      </p>
    ) : null;

  const header = () => {
    if (profile.headerStyle === 'banner') {
      return (
        <header className="px-6 md:px-10 py-7" style={{ background: theme.accent }}>
          {nameBlock(true)}
          {contactLine(true)}
        </header>
      );
    }
    if (profile.headerStyle === 'centered') {
      return (
        <header
          className={`${padClass(profile.density)} pb-5 mb-1 text-center`}
          style={{ borderBottom: `1px solid ${theme.accent}33` }}
        >
          {nameBlock(false)}
          {contactLine(false)}
        </header>
      );
    }
    if (profile.headerStyle === 'split') {
      return (
        <header
          className={`${padClass(profile.density)} pb-5 mb-1 flex flex-wrap items-start justify-between gap-4`}
          style={{ borderBottom: `1px solid ${theme.accent}33` }}
        >
          <div>{nameBlock(false)}</div>
          {showContactInHeader && contacts.length > 0 && (
            <ul className="text-sm text-right space-y-1" style={{ color: theme.muted }}>
              {contacts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </header>
      );
    }
    // plain — for sidebar layouts name may live in sidebar
    if (hasSidebar && profile.sidebarFill === 'accent') {
      return null;
    }
    return (
      <header
        className={`${padClass(profile.density)} pb-5 mb-1`}
        style={{ borderBottom: `1px solid ${theme.accent}33` }}
      >
        {nameBlock(false)}
        {contactLine(false)}
      </header>
    );
  };

  const sidebarBg =
    profile.sidebarFill === 'accent'
      ? theme.accent
      : profile.sidebarFill === 'muted'
        ? `${theme.accent}14`
        : theme.background;
  const sidebarLight = profile.sidebarFill === 'accent';

  const sidebar = hasSidebar ? (
    <aside
      className={padClass(profile.density)}
      style={{
        background: sidebarBg,
        color: sidebarLight ? '#f8fafc' : theme.text,
        order: profile.columns === 'sidebar-right' ? 2 : 0,
      }}
    >
      {profile.sidebarFill === 'accent' && (
        <div className="mb-6">
          {nameBlock(true)}
        </div>
      )}
      {profile.sidebarSections.map((sec) => {
        if (sec === 'contact' && showContactInSidebar && contacts.length > 0) {
          return (
            <div key="contact" className="mb-6">
              <p
                className="text-[11px] uppercase tracking-wider mb-2"
                style={{
                  color: sidebarLight ? 'rgba(255,255,255,0.7)' : theme.muted,
                }}
              >
                Contact
              </p>
              <ul
                className="space-y-1.5 text-xs leading-relaxed"
                style={{
                  color: sidebarLight ? 'rgba(255,255,255,0.95)' : theme.text,
                }}
              >
                {contacts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        }
        if (sec === 'skills' && showSkillsInSidebar) {
          return (
            <div key="skills" className="mb-6">
              <p
                className="text-[11px] uppercase tracking-wider mb-2"
                style={{
                  color: sidebarLight ? 'rgba(255,255,255,0.7)' : theme.muted,
                }}
              >
                {labels.skills}
              </p>
              {renderSkills(sidebarLight)}
            </div>
          );
        }
        if (sec === 'summary' && resume.summary) {
          return (
            <div key="summary" className="mb-6">
              {renderSummary(sidebarLight)}
            </div>
          );
        }
        if (sec === 'education' && resume.education?.length) {
          return (
            <div key="education" className="mb-6">
              {renderEducation(sidebarLight)}
            </div>
          );
        }
        return null;
      })}
    </aside>
  ) : null;

  if (hasSidebar) {
    return (
      <article
        id="resume-print"
        className={`grid ${sidebarColClass(profile.sidebarWidth)} ${shellClass}`}
        style={{
          fontFamily: fontStack,
          background: theme.background,
          color: theme.text,
        }}
      >
        {sidebar}
        <div style={{ order: 1 }}>
          {header()}
          {mainStack}
        </div>
      </article>
    );
  }

  return (
    <article
      id="resume-print"
      className={shellClass}
      style={{
        fontFamily: fontStack,
        background: theme.background,
        color: theme.text,
      }}
    >
      {header()}
      {mainStack}
    </article>
  );
}
