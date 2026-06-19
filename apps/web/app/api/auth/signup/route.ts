export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signUpWithEmail } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password || !body?.fullName) {
    return err('email, password and fullName are required', 422);
  }

  if (body.password.length < 8) {
    return err('Password must be at least 8 characters', 422);
  }

  const result = await signUpWithEmail(body.email, body.password, body.fullName);

  // Email already exists in auth
  if (!result.ok && /already registered|already exists|user already/i.test(result.error ?? '')) {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    // Try to resend the confirmation email: only works for unconfirmed accounts
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: body.email,
      options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
    });

    if (!resendError) {
      // Unconfirmed account: confirmation email resent successfully
      return ok({ userId: null, nextStep: 'email_confirmation' }, 200);
    }

    // Resend rejected → account is already confirmed → ask them to log in
    return err('An account with this email already exists. Please log in instead.', 422);
  }

  if (!result.ok) return err(result.error, result.status);

  return ok({ userId: result.userId, nextStep: 'email_confirmation' }, 201);
}
