export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import { logger, withAxiom } from '@/lib/axiom/server';

async function sendConfirmationEmail(email: string, actionLink: string) {
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111827; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Confirm your email</h1>
      <p style="margin: 0 0 16px;">Click the button below to confirm your email and finish creating your Engero account.</p>
      <p>
        <a href="${actionLink}" style="display:inline-block;padding:14px 24px;background:#047857;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:600;">Confirm my email</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #6b7280;">${actionLink}</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Confirm your email for Engero',
    html,
  });
}

// POST /api/auth/resend-email
// Body: { email, password }
export const POST = withAxiom(async (req: NextRequest) => {
  const context = { endpoint: '/api/auth/resend-email', method: 'POST' };
  const body = await req.json().catch(() => null);

  if (!body?.email) {
    logger.warn('Email resend validation failed: Missing email parameter', { ...context });
    return err('email is required', 422);
  }

  if (!body?.password) {
    logger.warn('Email resend validation failed: Missing password parameter', { ...context, email: body.email });
    return err('password is required', 422);
  }

  logger.info('Initiating administrative confirmation link generation', { ...context, email: body.email });
  const supabase = createServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email: body.email,
    password: body.password,
    options: {
      redirectTo: `${siteUrl}/api/auth/confirm`,
    },
  });

  if (error) {
    logger.error('Supabase admin confirmation link generation failed', { 
      ...context, 
      email: body.email, 
      error: error.message 
    });
    return err(error.message || 'Failed to generate confirmation link', 400);
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    logger.error('Supabase link property generation anomaly: Missing action link payload', { ...context, email: body.email });
    return err('Failed to generate confirmation link', 500);
  }

  logger.info('Dispatching outbound confirmation email transaction', { ...context, email: body.email });
  const { ok: emailOk, error: emailError } = await sendConfirmationEmail(body.email, actionLink);
  
  if (!emailOk) {
    logger.error('Outbound mail transport delivery failure', { 
      ...context, 
      email: body.email, 
      error: emailError ?? 'Unknown mail transport exception' 
    });
    return err(emailError ?? 'Failed to send confirmation email', 500);
  }

  logger.info('Confirmation email delivery queued successfully', { ...context, email: body.email });
  return ok({ message: 'Confirmation email resent. Check your inbox.' }, 200);
});