import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId } from '@/lib/services/artists';
import { getArtistEvents, createEvent } from '@/lib/services/events';
import type { EventInput } from '@/lib/services/events';

async function resolveArtist(slug: string, userId: string) {
  const result = await getArtistByUserId(userId);
  if (!result.ok || !result.artist) return null;
  if (result.artist.slug !== slug) return null;
  return result.artist;
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = await createClient();
  const { data: artistRow } = await supabase
    .from('artists')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!artistRow) return err('Not found', 404);
  const events = await getArtistEvents(artistRow.id);
  return ok({ events });
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

  let body: Partial<EventInput>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  if (!body.title || !body.date) return err('title and date are required');
  if (!body.contacts || body.contacts.length === 0) return err('At least one contact is required');

  const result = await createEvent(artist.id, body as EventInput);
  if (!result.ok) return err(result.error, 500);
  return ok({ event: result.event }, 201);
}
