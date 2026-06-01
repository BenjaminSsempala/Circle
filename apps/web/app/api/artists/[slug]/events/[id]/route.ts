import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId } from '@/lib/services/artists';
import { updateEvent, deleteEvent } from '@/lib/services/events';
import type { EventInput } from '@/lib/services/events';

async function resolveArtist(slug: string, userId: string) {
  const result = await getArtistByUserId(userId);
  if (!result.ok || !result.artist) return null;
  if (result.artist.slug !== slug) return null;
  return result.artist;
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artist = await resolveArtist(params.slug, user.id);
  if (!artist) return err('Artist not found', 404);

  let body: Partial<EventInput>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const result = await updateEvent(params.id, artist.id, body);
  if (!result.ok) return err(result.error, 500);
  return ok({ event: result.event });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artist = await resolveArtist(params.slug, user.id);
  if (!artist) return err('Artist not found', 404);

  const result = await deleteEvent(params.id, artist.id);
  if (!result.ok) return err(result.error, 500);
  return ok({ ok: true });
}
