import { z } from 'zod';

const ReviewLinkSchema = z.object({
  title: z.string().describe('Short label for the reference'),
  url: z
    .string()
    .describe('https URL to official/high-quality docs for revision'),
});

export const InterviewPrepSchema = z.object({
  jobSummary: z.string().describe('One-sentence summary of the JD core requirements'),
  questions: z
    .array(
      z.object({
        id: z.number().describe('Question number starting from 1'),
        question: z.string().describe('High-frequency interview question in English'),
        whyAsked: z
          .string()
          .describe('Why an interviewer asks this — underlying intent'),
        suggestedAnswer: z
          .string()
          .describe(
            'A strong sample answer in 4-8 sentences (STAR when useful), ready to adapt'
          ),
        keyPoints: z
          .array(z.string())
          .describe('2-4 short answering tips'),
        // Required (not optional): DeepSeek structured output needs all properties required.
        reviewLinks: z
          .array(ReviewLinkSchema)
          .max(3)
          .describe(
            '1-3 real review links (official docs preferred); use [] only if none fit'
          ),
      })
    )
    .min(10)
    .max(15)
    .describe('Exactly 15 interview questions covering the JD broadly'),
});

export const JdResumeMatchSchema = z.object({
  overallFit: z
    .string()
    .describe('Overall fit assessment in 2-3 sentences'),
  fitScore: z
    .number()
    .describe('Fit score from 0 to 100 based on resume vs JD'),
  strongMatches: z
    .array(
      z.object({
        point: z.string().describe('Capability / experience that matches the JD'),
        evidence: z
          .string()
          .describe('Evidence from the resume that supports this match'),
      })
    )
    .describe('Strengths / suitable points'),
  gaps: z
    .array(
      z.object({
        point: z.string().describe('Missing or weak area vs JD requirements'),
        impact: z
          .string()
          .describe('Why this gap matters for this role'),
      })
    )
    .describe('Unsuitable / gap points'),
  improvementPlan: z
    .array(
      z.object({
        action: z.string().describe('Concrete improvement action before applying'),
        priority: z
          .string()
          .describe('Priority of this action: high, medium, or low'),
        detail: z.string().describe('How to execute this improvement'),
        reviewLinks: z
          .array(ReviewLinkSchema)
          .max(3)
          .describe(
            '1-3 real reference links for this improvement; use [] only if none fit'
          ),
      })
    )
    .describe('Actionable upgrade suggestions with references'),
});

/** NZ-style cover / recommendation letter for job applications. */
export const CoverLetterSchema = z.object({
  roleTitle: z
    .string()
    .describe('Target role title inferred from the JD'),
  companyHint: z
    .string()
    .describe(
      'Company or hiring team name if present in the JD; otherwise a short placeholder like "Hiring Manager"'
    ),
  letter: z
    .string()
    .describe(
      'Full cover letter body ready to copy: greeting, 3-4 paragraphs, closing and sign-off'
    ),
  highlights: z
    .array(z.string())
    .describe('3-5 key selling points woven into the letter'),
  tips: z
    .array(z.string())
    .describe('2-4 short NZ application tips specific to this letter / role'),
});

export type InterviewPrepResult = z.infer<typeof InterviewPrepSchema>;
export type JdResumeMatchResult = z.infer<typeof JdResumeMatchSchema>;
export type CoverLetterResult = z.infer<typeof CoverLetterSchema>;
