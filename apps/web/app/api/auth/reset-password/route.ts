export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { sendPasswordReset } from '@/lib/services/auth';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST /api/auth/reset-password
// Body: { email }
// Called by: web reset-password page, Flutter app
export const POST = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/reset-password', method: 'POST' };
  const body = await req.json().catch(() => null);

  if (!body?.email) {
    logger.warn('Password reset request rejected: Missing email parameter', { ...context });
    return err('email is required', 422);
  }

  logger.info('Processing password reset request', { ...context, email: body.email });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const result  = await sendPasswordReset(body.email, siteUrl);

  if (!result.ok) {
    logger.error('Password reset dispatch failed', { 
      ...context, 
      email: body.email, 
      error: result.error, 
      status: result.status 
    });
    return err(result.error, result.status);
  }

  logger.info('Password reset transactional pipeline finished successfully', { ...context, email: body.email });

  // Always return ok: don't reveal whether the email exists
  return ok({ message: 'If that email exists, a reset link has been sent.' });
});