const STORAGE_KEY = 'practice-done-ids';

function readIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function isPracticeDone(problemId: string): boolean {
  return readIds().has(problemId);
}

export function setPracticeDone(problemId: string, done: boolean): void {
  const ids = readIds();
  if (done) ids.add(problemId);
  else ids.delete(problemId);
  writeIds(ids);
}

export function listPracticeDoneIds(): string[] {
  return [...readIds()];
}
