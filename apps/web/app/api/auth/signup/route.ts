export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signUpWithEmail } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';
import { logger, withAxiom } from '@/lib/axiom/server';

// Wrap the route handler with withAxiom
export const POST = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/signup' };
  const body = await req.json().catch(() => null);
  logger.info('Received signup request', { ...context, body });

  if (!body?.email || !body?.password || !body?.fullName) {
    logger.warn('Signup validation failed: Missing payload parameters', { ...context, email: body?.email });
    // Note: The withAxiom handler handles flushing logs on response generation automatically
    return err('email, password and fullName are required', 422);
  }

  if (body.password.length < 8) {
    logger.warn('Signup validation failed: Password too short', { ...context, email: body.email });
    return err('Password must be at least 8 characters', 422);
  }

  logger.info('Initiating email signup flow', { ...context, email: body.email });
  const result = await signUpWithEmail(body.email, body.password, body.fullName);

  // Email already exists in auth
  if (!result.ok && /already registered|already exists|user already/i.test(result.error ?? '')) {
    logger.info('Signup conflict detected: Email already registered. Assessing account status', { ...context, email: body.email });
    
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: body.email,
      options: { emailRedirectTo: `${siteUrl}/api/auth/confirm` },
    });

    if (!resendError) {
      logger.info('Account unconfirmed: Resent signup confirmation email successfully', { ...context, email: body.email });
      return ok({ userId: null, nextStep: 'email_confirmation' }, 200);
    }

    logger.warn('Resend verification rejected: Account already fully active', { ...context, email: body.email, supabaseError: resendError.message });
    return err('An account with this email already exists. Please log in instead.', 422);
  }

  if (!result.ok) {
    logger.error('Authentication service signup failure', { ...context, email: body.email, error: result.error, status: result.status });
    return err(result.error, result.status);
  }

  logger.info('User account provisioned successfully', { ...context, email: body.email, userId: result.userId });
  return ok({ userId: result.userId, nextStep: 'email_confirmation' }, 201);
});