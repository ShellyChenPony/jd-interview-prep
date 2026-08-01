import { createOpenAI } from '@ai-sdk/openai';
import { extractJsonMiddleware, wrapLanguageModel } from 'ai';

/**
 * Shared OpenAI client.
 * In regions where api.openai.com is unreachable, set OPENAI_BASE_URL
 * to a proxy or OpenAI-compatible gateway (e.g. https://your-proxy/v1).
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export const defaultChatModel =
  process.env.OPENAI_MODEL?.trim() || 'deepseek-chat';

/**
 * DeepSeek (and some gateways) wrap structured JSON in ```json fences.
 * extractJsonMiddleware strips those so Output.object / useObject can parse.
 */
export function getChatModel() {
  return wrapLanguageModel({
    model: openai(defaultChatModel),
    middleware: extractJsonMiddleware(),
  });
}
