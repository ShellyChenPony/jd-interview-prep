import { Output, streamText } from 'ai';
import { z } from 'zod';
import { getChatModel } from '@/lib/openai';

export const maxDuration = 30;

const InterviewPrepSchema = z.object({
  jobSummary: z.string().describe('一句话总结该 JD 的核心能力要求'),
  questions: z.array(
    z.object({
      id: z.number(),
      question: z.string().describe('高频英文面试问题'),
      whyAsked: z.string().describe('面试官问这个问题的底层意图'),
      keyPoints: z.array(z.string()).describe('建议回答的 2-3 个关键点（STAR法则）'),
    })
  ),
});

export async function POST(req: Request) {
  const { jdText } = await req.json();

  if (!jdText) {
    return new Response('Missing JD content', { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  const result = streamText({
    model: getChatModel(),
    output: Output.object({ schema: InterviewPrepSchema }),
    prompt: `你是一位硅谷顶尖的资深技术面试官与职业教练。
请分析以下英文/中文的 Job Description (JD)，提取出最关键的 5 个英文面试问题。
只返回原始 JSON，不要使用 markdown 代码块。

JD 内容如下：
${jdText}
`,
  });

  return result.toTextStreamResponse();
}
