const STORAGE_KEY = 'jd-prep-device-id';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable anonymous id for this browser (no login required). */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = createId();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
