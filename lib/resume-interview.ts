import { z } from 'zod';

export const ResumeInterviewMarkerSchema = z.object({
  id: z.number().describe('Display number on the resume, starting from 1'),
  section: z
    .enum(['skill', 'project', 'experience'])
    .describe('Which resume section this marker anchors to'),
  groupIndex: z
    .number()
    .describe('Index of skill group / project / experience job (0-based)'),
  itemIndex: z
    .number()
    .describe(
      'For experience: bullet index (0-based). For skill/project: use -1 for the whole row'
    ),
  anchorText: z
    .string()
    .describe('Short text of the resume line this marker is about'),
  questions: z
    .array(
      z.object({
        question: z.string().describe('Interview question'),
        suggestedAnswer: z
          .string()
          .describe('Suggested answer in 4-8 sentences, STAR when useful'),
        keyPoints: z
          .array(z.string())
          .describe('2-4 short answering tips'),
        // Keep required (not optional): DeepSeek structured output rejects
        // schemas where object properties are not all listed as required.
        reviewLinks: z
          .array(
            z.object({
              title: z
                .string()
                .describe('Short label, e.g. React Docs: useEffect'),
              url: z
                .string()
                .describe(
                  'https URL to an official/high-quality docs page for review'
                ),
            })
          )
          .max(3)
          .describe(
            '1-3 real review/reference links (official docs preferred); use [] only if none fit'
          ),
      })
    )
    .min(1)
    .max(3)
    .describe('1-3 questions for this resume line'),
});

export const ResumeInterviewSchema = z.object({
  markers: z
    .array(ResumeInterviewMarkerSchema)
    .min(1)
    .max(10)
    .describe('Interview hotspots linked to skills and project/experience highlights'),
});

export type ResumeInterviewMarker = z.infer<typeof ResumeInterviewMarkerSchema>;
export type ResumeInterviewQuestion = ResumeInterviewMarker['questions'][number];
export type ResumeInterviewResult = z.infer<typeof ResumeInterviewSchema>;

export function parseInterviewMarkers(value: unknown): ResumeInterviewMarker[] {
  const parsed = z.array(ResumeInterviewMarkerSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function markersForTarget(
  markers: ResumeInterviewMarker[] | undefined,
  section: ResumeInterviewMarker['section'],
  groupIndex: number,
  itemIndex = -1
): ResumeInterviewMarker[] {
  if (!markers?.length) return [];
  return markers.filter(
    (marker) =>
      marker.section === section &&
      marker.groupIndex === groupIndex &&
      (marker.itemIndex ?? -1) === itemIndex
  );
}
