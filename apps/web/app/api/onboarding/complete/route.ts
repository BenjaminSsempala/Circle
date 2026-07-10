export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { completeOnboarding, getArtistByUserId } from '@/lib/services/artists';
import { sendArtistWelcomeEmail } from '@/lib/email';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST: mark onboarding_complete = true, then send welcome email
export const POST = withAxiom(async () => {
  const context = { endpoint: '/api/onboarding/complete', method: 'POST' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Onboarding finalization rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  logger.info('Initiating final onboarding state conversion', { ...context, userId: user.id });
  
  // Mark onboarding complete first: this is the critical operation
  const result = await completeOnboarding(user.id);
  if (!result.ok) {
    logger.error('Onboarding profile state transition failed', { ...context, userId: user.id, error: result.error });
    return err(result.error, 500);
  }

  logger.info('User onboarding lifecycle successfully completed', { ...context, userId: user.id });

  // Send welcome email: fire-and-forget, don't block or fail the response
  if (user.email) {
    getArtistByUserId(user.id).then((artistResult) => {
      if (artistResult.ok && artistResult.artist) {
        sendArtistWelcomeEmail({
          to:          user.email!,
          artistName:  artistResult.artist.name,
          artistSlug:  artistResult.artist.slug,
        }).catch((e) => {
          logger.error('Onboarding welcome email async transport delivery failure', { 
            ...context, 
            userId: user.id, 
            error: e instanceof Error ? e.message : String(e) 
          });
        });
      } else if (!artistResult.ok) {
        logger.error('Failed to resolve artist context payload for welcome email', { 
          ...context, 
          userId: user.id, 
          error: artistResult.error 
        });
      }
    }).catch((e) => {
      logger.error('Unhandled lookup exception inside welcome email routine', { 
        ...context, 
        userId: user.id, 
        error: e instanceof Error ? e.message : String(e) 
      });
    });
  } else {
    logger.warn('Skipped welcome email process: User profile missing communication address', { ...context, userId: user.id });
  }

  return ok({ ok: true });
});