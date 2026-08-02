import type { FetchFunction } from '@ai-sdk/provider-utils';
import { getDeviceId } from '@/lib/device-id';

export const AI_QUOTA_CHANGED_EVENT = 'ai-quota-changed';

/** Headers for billable AI / useObject calls (device quota). */
export function aiRequestHeaders(): Record<string, string> {
  return {
    'x-device-id': getDeviceId(),
  };
}

export function notifyAiQuotaChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AI_QUOTA_CHANGED_EVENT));
}

/** Wrap fetch so quota UI refreshes after every AI request. */
export const aiFetch: FetchFunction = async (input, init) => {
  try {
    return await fetch(input, init);
  } finally {
    notifyAiQuotaChanged();
  }
};
