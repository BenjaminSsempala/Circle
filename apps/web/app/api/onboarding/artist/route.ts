import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, upsertArtistProfile } from '@/lib/services/artists';

// GET — fetch existing artist data so the page can pre-populate on resume
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await getArtistByUserId(user.id);
  if (!result.ok) return err(result.error, 500);

  return ok({ artist: result.artist ?? null });
}

// POST — create or update artist profile (Step 1)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body');
  }

  const { fullName, tagline, artForm, otherArtForm, tags, city, country, bio, profilePhotoUrl, customSlug } = body as {
    fullName?: string;
    tagline?: string;
    artForm?: string;
    otherArtForm?: string;
    tags?: string[];
    city?: string;
    country?: string;
    bio?: string;
    profilePhotoUrl?: string;
    customSlug?: string;
  };

  if (!fullName || !artForm || !city || !country) {
    return err('Missing required fields: fullName, artForm, city, country');
  }

  const result = await upsertArtistProfile(user.id, {
    name: fullName,
    tagline,
    artForm,
    otherArtForm,
    tags,
    city,
    country,
    bio,
    profilePhotoUrl,
    customSlug,
  });

  if (!result.ok) return err(result.error, 500);
  return ok({ artist: result.artist });
}
