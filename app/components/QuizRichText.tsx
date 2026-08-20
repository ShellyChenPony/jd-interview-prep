import type { ReactNode } from 'react';

/**
 * Show code simply inside braces, one statement/line per row.
 */
export function QuizCodeLines({ code }: { code: string }): ReactNode {
  const lines = toCodeLines(code);
  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[13px] leading-7 text-slate-800">
      <div>{'{'}</div>
      {lines.map((line, i) => (
        <div key={i} className="pl-4">
          {line}
        </div>
      ))}
      <div>{'}'}</div>
    </div>
  );
}

/**
 * Question stem + optional embedded code (fenced / bare after "?") as braced lines.
 */
export function QuizRichText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}): ReactNode {
  const { prompt, code } = splitQuestionAndCode(text.trim());

  return (
    <div className={`space-y-2.5 ${className}`}>
      {prompt ? (
        <p className="text-sm font-semibold leading-relaxed text-slate-900">
          {prompt}
        </p>
      ) : null}
      {code ? <QuizCodeLines code={code} /> : null}
    </div>
  );
}

/** Explanation / option text — keep plain; only brace multi-line fenced code. */
export function QuizPlainRichText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}): ReactNode {
  const segments = splitFencedCode(text.trim());
  return (
    <div className={`space-y-2 ${className}`}>
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <QuizCodeLines key={i} code={seg.value} />
        ) : (
          <p key={i} className="text-sm leading-relaxed text-slate-800">
            {seg.value}
          </p>
        )
      )}
    </div>
  );
}

function toCodeLines(code: string): string[] {
  const trimmed = code.replace(/^```[\w+-]*\n?/, '').replace(/\n?```$/, '').trim();
  if (!trimmed) return [];

  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.endsWith(';') ? l : `${l};`.replace(/;;$/, ';')));
  }

  // Single-line glued statements → split on "; "
  return trimmed
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

function splitQuestionAndCode(text: string): { prompt: string; code: string } {
  if (text.includes('```')) {
    const segments = splitFencedCode(text);
    const prompt = segments
      .filter((s) => s.type === 'text')
      .map((s) => s.value)
      .join(' ')
      .trim();
    const code = segments
      .filter((s) => s.type === 'code')
      .map((s) => s.value)
      .join('\n');
    return { prompt, code };
  }

  const qMark = text.indexOf('?');
  if (qMark === -1 || qMark >= text.length - 1) {
    return { prompt: text, code: '' };
  }

  const after = text.slice(qMark + 1).trim();
  const looksLikeCode =
    /console\.|setTimeout|Promise\.|function\s|=>|const\s|let\s|var\s/.test(after) &&
    /;/.test(after);

  if (!looksLikeCode) {
    return { prompt: text, code: '' };
  }

  return {
    prompt: text.slice(0, qMark + 1).trim(),
    code: after,
  };
}

type Segment = { type: 'text' | 'code'; value: string };

function splitFencedCode(input: string): Segment[] {
  const re = /```[\w+-]*\n?([\s\S]*?)```/g;
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) {
      out.push({ type: 'text', value: input.slice(last, m.index).trim() });
    }
    out.push({ type: 'code', value: m[1].replace(/^\n|\n$/g, '') });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    const rest = input.slice(last).trim();
    if (rest) out.push({ type: 'text', value: rest });
  }
  return out.length > 0 ? out.filter((s) => s.value) : [{ type: 'text', value: input }];
}
