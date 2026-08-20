import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/update-session';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images, and large file upload.
     * extract-text is excluded so PDF bodies are not truncated by the proxy buffer.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/extract-text|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
