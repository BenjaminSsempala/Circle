import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { completeOnboarding, getArtistByUserId } from '@/lib/services/artists';
import { sendArtistWelcomeEmail } from '@/lib/email';

// POST — mark onboarding_complete = true, then send welcome email
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  // Mark onboarding complete first — this is the critical operation
  const result = await completeOnboarding(user.id);
  if (!result.ok) return err(result.error, 500);

  // Send welcome email — fire-and-forget, don't block or fail the response
  if (user.email) {
    const artistResult = await getArtistByUserId(user.id);
    if (artistResult.ok && artistResult.artist) {
      sendArtistWelcomeEmail({
        to:          user.email,
        artistName:  artistResult.artist.name,
        artistSlug:  artistResult.artist.slug,
      }).catch((e) => console.error('[email] welcome send failed:', e));
    }
  }

  return ok({ ok: true });
}
