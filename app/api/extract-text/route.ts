import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text = '';

    if (name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      text = parsed.text ?? '';
      await parser.destroy().catch(() => undefined);
    } else if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value ?? '';
    } else if (name.endsWith('.txt') || name.endsWith('.md')) {
      text = buffer.toString('utf8');
    } else {
      return Response.json(
        { error: 'Unsupported type. Use .txt, .md, .docx, or .pdf' },
        { status: 400 }
      );
    }

    const cleaned = text.replace(/\r\n/g, '\n').trim();
    if (!cleaned) {
      return Response.json({ error: 'No text found in file' }, { status: 400 });
    }

    return Response.json({ text: cleaned });
  } catch {
    return Response.json({ error: 'Failed to extract text from file' }, { status: 500 });
  }
}
