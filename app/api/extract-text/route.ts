import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Stay under typical host / proxy body limits. */
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      {
        error:
          'Invalid upload. File may be too large or corrupted (max 20MB). Try a smaller PDF, .docx, or .txt.',
      },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return Response.json({ error: 'Missing file' }, { status: 400 });
  }

  if (file.size <= 0) {
    return Response.json({ error: 'Empty file' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: 'File too large (max 20MB). Try exporting a text-based PDF or .docx.' },
      { status: 400 }
    );
  }

  const name = (file instanceof File ? file.name : 'upload').toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    let text = '';

    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      const pdf = await getDocumentProxy(bytes);
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join('\n') : result.text;
    } else if (
      name.endsWith('.docx') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = result.value ?? '';
    } else if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
      text = new TextDecoder('utf-8').decode(bytes);
    } else {
      return Response.json(
        { error: 'Unsupported type. Use .txt, .md, .docx, or .pdf' },
        { status: 400 }
      );
    }

    const cleaned = text.replace(/\r\n/g, '\n').trim();
    if (!cleaned) {
      return Response.json(
        { error: 'No text found in file (scanned image PDFs are not supported yet)' },
        { status: 400 }
      );
    }

    return Response.json({ text: cleaned });
  } catch (err) {
    console.error('[extract-text]', err);
    const message = err instanceof Error ? err.message : 'Failed to extract text from file';
    return Response.json({ error: message }, { status: 500 });
  }
}
