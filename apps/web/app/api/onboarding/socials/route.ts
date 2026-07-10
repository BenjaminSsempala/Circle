export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { updateSocialLinks } from '@/lib/services/artists';
import { logger, withAxiom } from '@/lib/axiom/server';

// PATCH: save social link URLs (Step 3)
export const PATCH = withAxiom(async (request: Request) => {
  const context = { endpoint: '/api/onboarding/socials', method: 'PATCH' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Social links modification rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    logger.warn('Social links mutation validation failed: Invalid JSON format', { ...context, userId: user.id });
    return err('Invalid JSON body');
  }

  const { socialLinks } = body as { socialLinks?: Record<string, string> };
  const linksPayload = socialLinks ?? {};
  const platformKeys = Object.keys(linksPayload);

  logger.info('Initiating social platforms link updates', { 
    ...context, 
    userId: user.id, 
    platformsCount: platformKeys.length,
    platforms: platformKeys 
  });

  const result = await updateSocialLinks(user.id, linksPayload);
  
  if (!result.ok) {
    logger.error('Social media link data persistence failure', { 
      ...context, 
      userId: user.id, 
      error: result.error 
    });
    return err(result.error, 500);
  }

  logger.info('Social media connections modified successfully', { ...context, userId: user.id });
  return ok({ ok: true });
});