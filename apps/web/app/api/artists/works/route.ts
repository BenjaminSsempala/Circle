export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { addWork } from '@/lib/services/artists';
import type { Work } from '@/lib/services/artists';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Omit<Work, 'id'>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { title, category, type, provider, media_url, thumbnail_url, metadata } = body;
  if (!title || !type || !provider || !media_url) return err('title, type, provider, and media_url are required');

  const result = await addWork(user.id, { title, category, type, provider, media_url, thumbnail_url, metadata });
  if (!result.ok) return err(result.error, 500);
  return ok({ work: result.work });
}
