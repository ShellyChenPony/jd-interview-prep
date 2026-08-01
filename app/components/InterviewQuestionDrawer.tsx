'use client';

import type { ResumeInterviewMarker } from '@/lib/resume-interview';

type Props = {
  open: boolean;
  marker: ResumeInterviewMarker | null;
  onClose: () => void;
};

export default function InterviewQuestionDrawer({ open, marker, onClose }: Props) {
  return (
    <div
      className={`fixed inset-0 z-50 print:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close interview questions"
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Interview questions"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {marker ? `Q${marker.id}` : 'Interview prep'}
            </h2>
            {marker?.anchorText && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Based on: {marker.anchorText}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!marker && (
            <p className="text-sm text-gray-500">Select a numbered marker on the resume.</p>
          )}

          {marker?.questions.map((item, index) => (
            <section
              key={`${marker.id}-${index}`}
              className="rounded-2xl border border-gray-200 p-4 space-y-3"
            >
              <p className="text-sm font-semibold text-gray-900">
                {marker.questions.length > 1 ? `${index + 1}. ` : ''}
                {item.question}
              </p>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">
                  Suggested answer
                </p>
                <p className="text-sm text-blue-950 leading-relaxed whitespace-pre-wrap">
                  {item.suggestedAnswer}
                </p>
              </div>

              {item.keyPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Key tips
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {item.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.reviewLinks && item.reviewLinks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Review links
                  </p>
                  <ul className="space-y-1.5">
                    {item.reviewLinks.map((link) => {
                      if (!link?.url) return null;
                      const href = link.url.startsWith('http')
                        ? link.url
                        : `https://${link.url}`;
                      return (
                        <li key={`${link.title}-${link.url}`}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline break-all"
                          >
                            {link.title || href}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
