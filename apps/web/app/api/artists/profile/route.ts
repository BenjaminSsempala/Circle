import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { patchArtistProfile, updateArtistSlug } from '@/lib/services/artists';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  // Handle slug change separately — needs history tracking
  if ('slug' in body) {
    const newSlug = String(body.slug).toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!newSlug) return err('Invalid slug');
    const slugResult = await updateArtistSlug(user.id, newSlug);
    if (!slugResult.ok) return err(slugResult.error, 400);
  }

  const allowed = ['name', 'tagline', 'bio', 'tags', 'city', 'country', 'profile_photo', 'art_forms', 'social_links', 'epk_data', 'rate_card_data'];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length > 0) {
    const result = await patchArtistProfile(user.id, fields as Parameters<typeof patchArtistProfile>[1]);
    if (!result.ok) return err(result.error, 500);
  }

  return ok({ ok: true });
}
