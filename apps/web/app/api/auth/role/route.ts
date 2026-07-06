export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { setUserRole } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST /api/auth/role
// Body: { role: 'artist' | 'audience', displayName?: string }
// Auth: Bearer token required
// Called by: web signup page (role step), Flutter app
export const POST = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/role', method: 'POST' };
  const body = await req.json().catch(() => null);

  if (!body?.role || !['artist', 'audience'].includes(body.role)) {
    logger.warn('Role assignment validation failed: Invalid or missing role parameter', { 
      ...context, 
      submittedRole: body?.role 
    });
    return err('role must be "artist" or "audience"', 422);
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    logger.warn('Role assignment rejected: Session missing or invalid token', { ...context });
    return err('Unauthorised: please sign in first', 401);
  }

  logger.info('Processing account role assignment request', { ...context, userId: user.id, targetRole: body.role });
  const fullName = body.displayName || user.user_metadata?.display_name || '';
  const result = await setUserRole(user.id, body.role, fullName);
  
  if (!result.ok) {
    logger.error('Account service role provision failure', { 
      ...context, 
      userId: user.id, 
      targetRole: body.role,
      error: result.error,
      status: result.status
    });
    return err(result.error, result.status);
  }

  const redirectTo = body.role === 'audience' ? '/discover' : '/onboarding/artist';
  
  logger.info('Account role assigned successfully', { 
    ...context, 
    userId: user.id, 
    assignedRole: body.role, 
    destination: redirectTo 
  });

  return ok({ role: body.role, redirectTo }, 201);
});