import { createOpenAI } from '@ai-sdk/openai';

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
