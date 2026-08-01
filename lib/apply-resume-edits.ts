import type { ResumeTemplate } from '@/lib/resume-template';

export type TextReplacement = {
  from: string;
  to: string;
};

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function isPhoneLike(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 7 && digits.length <= 15;
}

function extractPhoneTokens(text: string): string[] {
  const matches = text.match(/(?:\+?\d[\d\s\-().]{5,}\d)/g) ?? [];
  const tokens: string[] = [];
  for (const raw of matches) {
    const token = raw.trim();
    if (!isPhoneLike(token)) continue;
    if (!tokens.some((t) => digitsOnly(t) === digitsOnly(token))) {
      tokens.push(token);
    }
  }
  return tokens;
}

/**
 * Expand a middle edit so we replace a whole token (esp. phone numbers),
 * not a single digit like "0" → "1".
 */
function expandToToken(
  text: string,
  start: number,
  endInclusive: number
): { start: number; end: number } {
  let s = start;
  let e = endInclusive + 1; // exclusive

  const charAt = (i: number) => text[i] ?? '';
  const phoneChar = (c: string) => /[\d+\-().\s]/.test(c);
  const wordChar = (c: string) => /[A-Za-z0-9\u4e00-\u9fff@._]/.test(c);

  const sample = text.slice(Math.max(0, start - 1), endInclusive + 2);
  const treatAsPhone = /[\d+\-().]/.test(sample) && digitsOnly(sample).length >= 3;
  const isTokenChar = treatAsPhone ? phoneChar : wordChar;

  while (s > 0 && isTokenChar(charAt(s - 1))) s -= 1;
  while (e < text.length && isTokenChar(charAt(e))) e += 1;

  // Trim spaces that only sit on the edges of a phone token.
  if (treatAsPhone) {
    while (s < e && /\s/.test(charAt(s))) s += 1;
    while (e > s && /\s/.test(charAt(e - 1))) e -= 1;
  }

  return { start: s, end: e };
}

/** Longest common prefix / suffix → one middle hunk, expanded to token bounds. */
function middleTokenHunk(oldText: string, newText: string): TextReplacement | null {
  if (oldText === newText) return null;

  let start = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (start < minLen && oldText[start] === newText[start]) start += 1;

  let endOld = oldText.length - 1;
  let endNew = newText.length - 1;
  while (endOld >= start && endNew >= start && oldText[endOld] === newText[endNew]) {
    endOld -= 1;
    endNew -= 1;
  }

  if (start > endOld && start > endNew) return null;

  const oldSpan = expandToToken(oldText, start, Math.max(start, endOld));
  const newSpan = expandToToken(newText, start, Math.max(start, endNew));

  // Keep the two sides aligned to the same outer unchanged context when possible.
  const leftGrow = Math.min(start - oldSpan.start, start - newSpan.start);
  const fromStart = start - leftGrow;
  const toStart = start - leftGrow;

  const oldRight = oldText.length - 1 - endOld;
  const newRight = newText.length - 1 - endNew;
  const rightGrow = Math.min(
    oldSpan.end - (endOld + 1),
    newSpan.end - (endNew + 1),
    oldRight,
    newRight
  );
  const fromEnd = endOld + 1 + Math.max(0, rightGrow);
  const toEnd = endNew + 1 + Math.max(0, rightGrow);

  // Prefer full token windows when phone-like.
  const from = isPhoneLike(oldText.slice(oldSpan.start, oldSpan.end))
    ? oldText.slice(oldSpan.start, oldSpan.end)
    : oldText.slice(fromStart, fromEnd);
  const to = isPhoneLike(newText.slice(newSpan.start, newSpan.end))
    ? newText.slice(newSpan.start, newSpan.end)
    : newText.slice(toStart, toEnd);

  if (!from || from === to) return null;
  if (from.length > 280 || to.length > 280) return null;
  return { from: from.trim(), to: to.trim() };
}

function phoneReplacements(previousSource: string, nextSource: string): TextReplacement[] {
  const oldPhones = extractPhoneTokens(previousSource);
  const newPhones = extractPhoneTokens(nextSource);
  if (oldPhones.length === 0 || newPhones.length === 0) return [];

  // Pair by position when counts match; otherwise match by shared neighbors.
  const pairs: TextReplacement[] = [];
  if (oldPhones.length === newPhones.length) {
    for (let i = 0; i < oldPhones.length; i += 1) {
      if (digitsOnly(oldPhones[i]) !== digitsOnly(newPhones[i])) {
        pairs.push({ from: oldPhones[i], to: newPhones[i] });
      }
    }
    return pairs;
  }

  const newByDigits = new Map(newPhones.map((p) => [digitsOnly(p), p]));
  const oldDigitsSet = new Set(oldPhones.map(digitsOnly));
  for (const oldPhone of oldPhones) {
    const oldDigits = digitsOnly(oldPhone);
    if (newByDigits.has(oldDigits)) continue; // unchanged
    // Find a new phone that doesn't exist in old set (likely the edited one).
    for (const [digits, phone] of newByDigits) {
      if (!oldDigitsSet.has(digits) && Math.abs(digits.length - oldDigits.length) <= 1) {
        // Same length or off-by-one length → likely one-digit edit.
        let diff = 0;
        const max = Math.max(digits.length, oldDigits.length);
        for (let i = 0; i < max; i += 1) {
          if (digits[i] !== oldDigits[i]) diff += 1;
        }
        if (diff > 0 && diff <= 2) {
          pairs.push({ from: oldPhone, to: phone });
          break;
        }
      }
    }
  }
  return pairs;
}

/**
 * Derive simple replacements between the source snapshot (at AI format time)
 * and the edited textarea content.
 */
export function findTextReplacements(
  previousSource: string,
  nextSource: string
): TextReplacement[] {
  const oldText = normalizeNewlines(previousSource).trimEnd();
  const newText = normalizeNewlines(nextSource).trimEnd();
  if (oldText === newText) return [];

  const replacements: TextReplacement[] = [];
  const seen = new Set<string>();
  const push = (item: TextReplacement | null | undefined) => {
    if (!item?.from || item.from === item.to) return;
    const key = `${item.from}=>${item.to}`;
    if (seen.has(key)) return;
    seen.add(key);
    replacements.push(item);
  };

  // 1) Dedicated phone sync (handles formatting differences later at apply-time).
  for (const phone of phoneReplacements(oldText, newText)) push(phone);

  // 2) Line-level edits.
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  if (oldLines.length === newLines.length) {
    for (let i = 0; i < oldLines.length; i += 1) {
      const from = oldLines[i].trim();
      const to = newLines[i].trim();
      if (from && from !== to) push({ from, to });
    }
  }

  // 3) Token-expanded middle hunk (one-digit phone edits, small typos).
  push(middleTokenHunk(oldText, newText));

  return replacements.sort((a, b) => b.from.length - a.from.length);
}

function replacePhoneDigitsInText(
  value: string,
  fromDigits: string,
  toDisplay: string
): { value: string; hits: number } {
  if (!fromDigits || digitsOnly(value).indexOf(fromDigits) === -1) {
    return { value, hits: 0 };
  }

  // Replace phone-like tokens in the field whose digits equal fromDigits.
  const phoneRegex = /(?:\+?\d[\d\s\-().]{5,}\d)/g;
  let hits = 0;
  const next = value.replace(phoneRegex, (token) => {
    if (digitsOnly(token) !== fromDigits) return token;
    hits += 1;
    // Keep resume formatting if length of digit runs matches; else use edited display.
    const resumeDigits = digitsOnly(token);
    if (resumeDigits.length === digitsOnly(toDisplay).length) {
      // Map digits from toDisplay onto resume separators.
      const toDigits = digitsOnly(toDisplay);
      let di = 0;
      return token.replace(/\d/g, () => toDigits[di++] ?? '');
    }
    return toDisplay;
  });

  // Fallback: field is exactly/mostly the number without separators matched above.
  if (hits === 0 && digitsOnly(value) === fromDigits) {
    return { value: toDisplay, hits: 1 };
  }

  return { value: next, hits };
}

function applyToString(value: string, replacements: TextReplacement[]): {
  value: string;
  hits: number;
} {
  let next = value;
  let hits = 0;

  for (const { from, to } of replacements) {
    if (!from) continue;

    if (next.includes(from)) {
      const pieces = next.split(from);
      hits += pieces.length - 1;
      next = pieces.join(to);
      continue;
    }

    // Phone formatting mismatch: compare digits only.
    if (isPhoneLike(from) && isPhoneLike(to)) {
      const result = replacePhoneDigitsInText(next, digitsOnly(from), to);
      next = result.value;
      hits += result.hits;
    }
  }

  return { value: next, hits };
}

function applyToUnknown(
  value: unknown,
  replacements: TextReplacement[]
): { value: unknown; hits: number } {
  if (typeof value === 'string') {
    return applyToString(value, replacements);
  }
  if (Array.isArray(value)) {
    let hits = 0;
    const items = value.map((item) => {
      const result = applyToUnknown(item, replacements);
      hits += result.hits;
      return result.value;
    });
    return { value: items, hits };
  }
  if (value && typeof value === 'object') {
    let hits = 0;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const result = applyToUnknown(child, replacements);
      hits += result.hits;
      out[key] = result.value;
    }
    return { value: out, hits };
  }
  return { value, hits: 0 };
}

/** Apply textarea edits onto an already-generated resume without calling AI. */
export function applySourceEditsToResume(
  resume: ResumeTemplate,
  previousSource: string,
  nextSource: string
): {
  resume: ResumeTemplate;
  replacements: TextReplacement[];
  hits: number;
} {
  const replacements = findTextReplacements(previousSource, nextSource);
  if (replacements.length === 0) {
    return { resume, replacements, hits: 0 };
  }

  const { value, hits } = applyToUnknown(resume, replacements);
  return {
    resume: value as ResumeTemplate,
    replacements,
    hits,
  };
}
