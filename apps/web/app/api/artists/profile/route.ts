import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { patchArtistProfile } from '@/lib/services/artists';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const allowed = ['name', 'bio', 'tags', 'city', 'country', 'profile_photo', 'art_forms'];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) return err('No valid fields provided');

  const result = await patchArtistProfile(user.id, fields as Parameters<typeof patchArtistProfile>[1]);
  if (!result.ok) return err(result.error, 500);
  return ok({ ok: true });
}
