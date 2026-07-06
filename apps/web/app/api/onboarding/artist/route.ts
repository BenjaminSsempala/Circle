export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, upsertArtistProfile } from '@/lib/services/artists';
import { logger, withAxiom } from '@/lib/axiom/server';

// GET — fetch existing artist data so the page can pre-populate on resume
export const GET = withAxiom(async () => {
  const context = { endpoint: '/api/artists/profile', method: 'GET' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Artist profile fetch rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  logger.info('Fetching existing artist profile for onboarding pre-population', { ...context, userId: user.id });
  const result = await getArtistByUserId(user.id);
  
  if (!result.ok) {
    logger.error('Failed to retrieve artist profile records', { ...context, userId: user.id, error: result.error });
    return err(result.error, 500);
  }

  return ok({ artist: result.artist ?? null });
});

// POST — create or update artist profile (Step 1)
export const POST = withAxiom(async (request: Request) => {
  const context = { endpoint: '/api/artists/profile', method: 'POST' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Artist profile mutation rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    logger.warn('Artist profile mutation validation failed: Invalid JSON format', { ...context, userId: user.id });
    return err('Invalid JSON body');
  }

  const { displayName, legalName, tagline, artForm, otherArtForm, tags, city, country, bio, profilePhotoUrl, customSlug } = body as {
    displayName?: string;
    legalName?: string;
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

  if (!displayName || !legalName || !artForm || !city || !country) {
    logger.warn('Artist profile mutation validation failed: Missing required fields', { 
      ...context, 
      userId: user.id,
      missingFields: Object.entries({ displayName, legalName, artForm, city, country })
        .filter(([_, val]) => !val)
        .map(([key]) => key)
    });
    return err('Missing required fields: displayName, legalName, artForm, city, country');
  }

  logger.info('Initiating artist profile save operation', { ...context, userId: user.id, artForm, customSlug });
  const result = await upsertArtistProfile(user.id, {
    displayName,
    legalName,
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

  if (!result.ok) {
    logger.error('Artist profile write exception encountered', { ...context, userId: user.id, error: result.error });
    return err(result.error, 500);
  }

  logger.info('Artist profile updated successfully', { ...context, userId: user.id, artistId: result.artist?.id });
  return ok({ artist: result.artist });
});