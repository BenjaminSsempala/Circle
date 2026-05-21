import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/resend-email
// Body: { email }
// Resends confirmation email for signup
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email) {
    return err('email is required', 422);
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Resend confirmation email with redirect to confirmation handler
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: body.email,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/confirm`,
    },
  });

  if (error) {
    return err(error.message || 'Failed to resend email', 400);
  }

  return ok({ message: 'Confirmation email resent. Check your inbox.' }, 200);
}
