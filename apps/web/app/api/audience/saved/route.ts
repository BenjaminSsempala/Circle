export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const { data, error } = await supabase
    .from('saved_artists')
    .select('artist_id')
    .eq('audience_id', user.id);

  if (error) return err(error.message, 500);
  return ok({ ids: (data ?? []).map((r) => r.artist_id) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: { artistId?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON'); }
  if (!body.artistId) return err('artistId is required');

  const { error } = await supabase
    .from('saved_artists')
    .upsert({ audience_id: user.id, artist_id: body.artistId }, { onConflict: 'audience_id,artist_id' });

  if (error) return err(error.message, 500);
  return ok({ ok: true }, 201);
}
