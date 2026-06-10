export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId } from '@/lib/services/artists';

async function resolveArtist(slug: string, userId: string) {
  const artistResult = await getArtistByUserId(userId);
  if (!artistResult.ok || !artistResult.artist) return null;
  if (artistResult.artist.slug !== slug) return null;
  return artistResult.artist;
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artist = await resolveArtist(params.slug, user.id);
  if (!artist) return err('Artist not found', 404);

  let body: { date?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  if (!body.date) return err('date is required');

  const { error } = await supabase
    .from('availability')
    .upsert({ artist_id: artist.id, date: body.date, type: 'blackout' }, { onConflict: 'artist_id,date' });

  if (error) return err(error.message, 500);
  return ok({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artist = await resolveArtist(params.slug, user.id);
  if (!artist) return err('Artist not found', 404);

  let body: { date?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  if (!body.date) return err('date is required');

  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('artist_id', artist.id)
    .eq('date', body.date)
    .eq('type', 'blackout');

  if (error) return err(error.message, 500);
  return ok({ ok: true });
}
