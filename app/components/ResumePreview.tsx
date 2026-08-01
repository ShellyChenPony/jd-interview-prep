import type { ResumeTemplate } from '@/lib/resume-template';

type Props = {
  resume: Partial<ResumeTemplate> | undefined;
};

export default function ResumePreview({ resume }: Props) {
  if (!resume) return null;

  const contact = resume.contact;
  const contactLine = [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.linkedin,
    contact?.github,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      id="resume-print"
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-10 text-gray-900 print:border-0 print:shadow-none print:rounded-none print:p-0"
    >
      <header className="border-b border-gray-200 pb-5 mb-6">
        {resume.name && (
          <h2 className="text-3xl font-bold tracking-tight">{resume.name}</h2>
        )}
        {resume.title && (
          <p className="text-lg text-blue-700 font-medium mt-1">{resume.title}</p>
        )}
        {contactLine && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{contactLine}</p>
        )}
      </header>

      {resume.summary && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
            Summary
          </h3>
          <p className="text-sm leading-relaxed text-gray-800">{resume.summary}</p>
        </section>
      )}

      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
            Skills
          </h3>
          <ul className="space-y-1.5 text-sm">
            {resume.skills.map((group, index) =>
              group ? (
                <li key={`${group.category ?? 'skill'}-${index}`}>
                  {group.category && (
                    <span className="font-semibold text-gray-900">{group.category}: </span>
                  )}
                  <span className="text-gray-700">
                    {(group.items ?? []).filter(Boolean).join(' · ')}
                  </span>
                </li>
              ) : null
            )}
          </ul>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3">
            Experience
          </h3>
          <div className="space-y-5">
            {resume.experience.map((job, index) =>
              job ? (
                <div key={`${job.company ?? 'job'}-${job.role ?? index}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-semibold text-gray-900">
                      {job.role}{' '}
                      {job.company && (
                        <span className="font-normal text-gray-600">— {job.company}</span>
                      )}
                    </p>
                    {job.period && <p className="text-sm text-gray-500">{job.period}</p>}
                  </div>
                  {job.location && (
                    <p className="text-sm text-gray-500 mb-2">{job.location}</p>
                  )}
                  {job.bullets && job.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1 text-sm text-gray-800">
                      {job.bullets.map((bullet, bIdx) =>
                        bullet ? (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet}
                          </li>
                        ) : null
                      )}
                    </ul>
                  )}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {resume.education && resume.education.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3">
            Education
          </h3>
          {resume.education.map((ed, index) =>
            ed ? (
              <div
                key={`${ed.school ?? 'school'}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2"
              >
                <p className="text-sm">
                  {ed.degree && <span className="font-semibold">{ed.degree}</span>}
                  {ed.school && <span className="text-gray-600"> — {ed.school}</span>}
                </p>
                {ed.period && <p className="text-sm text-gray-500">{ed.period}</p>}
              </div>
            ) : null
          )}
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3">
            Projects
          </h3>
          <div className="space-y-4">
            {resume.projects.map((project, index) =>
              project ? (
                <div key={`${project.name ?? 'project'}-${index}`}>
                  {project.name && (
                    <p className="font-semibold text-sm text-gray-900">{project.name}</p>
                  )}
                  {project.description && (
                    <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  {project.tech && (
                    <p className="text-xs text-gray-500 mt-1">{project.tech}</p>
                  )}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}
    </article>
  );
}
