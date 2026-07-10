export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signInWithEmail } from '@/lib/services/auth';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST /api/auth/login
// Body: { email, password }
// Called by: web login page, Flutter app
// Returns: { userId, role, onboardingComplete, redirectTo }

export const POST = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/login' };
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    logger.warn('Login validation failed: Missing payload parameters', { 
      ...context, 
      email: body?.email 
    });
    return err('email and password are required', 422);
  }

  logger.info('Initiating email login flow', { ...context, email: body.email });
  const result = await signInWithEmail(body.email, body.password);

  if (!result.ok) {
    logger.error('Authentication login failure', { 
      ...context, 
      email: body.email, 
      error: result.error, 
      status: result.status 
    });
    return err(result.error, result.status);
  }

  logger.info('User logged in successfully', {
    ...context,
    email: body.email,
    userId: result.userId,
    role: result.role,
    onboardingComplete: result.onboardingComplete
  });

  return ok({
    userId:              result.userId,
    role:                result.role,
    onboardingComplete:  result.onboardingComplete,
    redirectTo:          result.redirectTo,
  });
});