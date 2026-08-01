'use client';

import { useState } from 'react';
import { useObject } from '@ai-sdk/react';
import { z } from 'zod';

const InterviewPrepSchema = z.object({
  jobSummary: z.string(),
  questions: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      whyAsked: z.string(),
      keyPoints: z.array(z.string()),
    })
  ),
});

export default function InterviewPrep() {
  const [jdText, setJdText] = useState('');

  const { object, submit, isLoading } = useObject({
    api: '/api/generate',
    schema: InterviewPrepSchema,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    submit({ jdText });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-10 space-y-4">
        <textarea
          className="w-full h-44 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition border-gray-300"
          placeholder="Paste the Job Description (JD) here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading || !jdText.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50 transition shadow"
        >
          {isLoading ? 'Analyzing JD & Generating...' : 'Generate Interview Questions ✨'}
        </button>
      </form>

      {object && (
        <section className="space-y-6">
          {object.jobSummary && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              <span className="font-semibold">Core Requirement: </span>
              {object.jobSummary}
            </div>
          )}

          <div className="space-y-4">
            {object.questions?.map((item, index) => (
              <div key={index} className="p-6 border rounded-2xl shadow-sm bg-white space-y-3">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm">
                    Q{index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{item?.question}</h3>
                </div>

                {item?.whyAsked && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    💡 <span className="font-medium">Why Asked: </span>
                    {item.whyAsked}
                  </p>
                )}

                {item?.keyPoints && item.keyPoints.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Key Answering Tips:
                    </span>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
                      {item.keyPoints.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
