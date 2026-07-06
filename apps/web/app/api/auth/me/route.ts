export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signOut } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST /api/auth/logout
export const POST = withAxiom(async () => {
  await signOut();
  logger.info('User logged out successfully');
  return ok({ loggedOut: true });
});

// PATCH /api/auth/me — update occasion_type
export const PATCH = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/me', method: 'PATCH' };
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    logger.warn('Profile update rejected: Unauthenticated session', { ...context });
    return err('Not authenticated', 401);
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    logger.warn('Profile update validation failed: Invalid JSON format', { ...context, userId: user.id });
    return err('Invalid JSON', 400);
  }

  const allowed = ['occasion_type', 'display_name', 'legal_name'];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) {
    logger.warn('Profile update validation failed: Missing valid fields', { ...context, userId: user.id, payloadKeys: Object.keys(body) });
    return err('No valid fields', 400);
  }

  logger.info('Initiating profile fields update', { ...context, userId: user.id, updatedFields: Object.keys(fields) });
  const { error: updateError } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id);

  if (updateError) {
    logger.error('Database update failed: Profiles table error', { ...context, userId: user.id, error: updateError.message });
    return err(updateError.message, 500);
  }

  logger.info('User profile fields updated successfully', { ...context, userId: user.id });
  return ok({ ok: true });
});

// GET /api/auth/me
// Returns the current user's profile and redirect target
// Called by: Flutter app on launch to check auth state
export const GET = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/me', method: 'GET' };
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Left as an info/debug level log since mobile clients hit this constantly on launch to test state
    logger.info('Auth check state query: Unauthenticated user session', { ...context });
    return err('Not authenticated', 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single();

  if (profileError) {
    logger.error('Database fetch failed: Unable to look up user profile context', { ...context, userId: user.id, error: profileError.message });
  }

  const redirectTo = !profile?.onboarding_complete
    ? profile?.role === 'audience'
      ? '/discover'
      : '/onboarding/artist'
    : profile?.role === 'audience'
      ? '/discover'
      : '/dashboard';

  logger.info('Auth state query verified successfully', { 
    ...context, 
    userId: user.id, 
    role: profile?.role, 
    onboardingComplete: profile?.onboarding_complete,
    targetDestination: redirectTo 
  });

  return ok({
    userId:             user.id,
    email:              user.email,
    role:               profile?.role,
    onboardingComplete: profile?.onboarding_complete,
    redirectTo,
  });
});